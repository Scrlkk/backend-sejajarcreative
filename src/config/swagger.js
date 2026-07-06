import swaggerJsdoc from "swagger-jsdoc";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sejajar API Docs",
      version: "1.0.0",
      description: `
## Sejajar Content Management System — REST API

API ini digunakan untuk mengelola kontrak, konten, task, penugasan, review, dan analytics.

### Autentikasi
Semua endpoint (kecuali \`/auth/login\`) membutuhkan **Bearer Token**.

1. #### Login melalui \`POST /api/auth/login\`
2. #### Salin \`accessToken\` dari response
3. #### Klik tombol **Authorize** di atas, masukkan: \`Bearer <accessToken>\`

### Role Hierarchy
\`\`\`
superadmin → owner → content_lead → content_editor / script_writer / admin_social_media
\`\`\`
      `,
      contact: {
        name: "Sejajar Dev Team",
        email: "dev@sejajar.id",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      // {
      //   url: "https://api.sejajar.id",
      //   description: "Production server",
      // },
    ],

    // ─── Global Security ───────
    security: [{ bearerAuth: [] }],

    components: {
      // ── Security Scheme ─────────────────────────────────────────
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Masukkan access token dari response login. Format: `Bearer <token>`",
        },
      },

      // ── Reusable Schemas ────────────────────────────────────────
      schemas: {
        // ─ Generic Responses ──────────────────────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            message: { type: "string", example: "OK" },
            data: {},
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string", example: "Pesan error" },
          },
        },
        ValidationErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string", example: "Validation failed" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string", example: "email" },
                  message: { type: "string", example: "Email tidak valid" },
                },
              },
            },
          },
        },

        // ─ Pagination Query ───────────────────────────────────────
        PaginationQuery: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              example: 20,
              description: "Jumlah data per halaman (max 100)",
            },
            offset: {
              type: "integer",
              example: 0,
              description: "Mulai dari index ke-n",
            },
          },
        },

        // ─ Enums ──────────────────────────────────────────────────
        UserRole: {
          type: "string",
          enum: [
            "superadmin",
            "owner",
            "content_lead",
            "content_editor",
            "script_writer",
            "admin_social_media",
          ],
        },
        ContractStatus: {
          type: "string",
          enum: ["active", "completed", "cancelled", "overdue"],
        },
        ContentPriority: {
          type: "string",
          enum: ["low", "medium", "high"],
        },
        TaskStatus: {
          type: "string",
          enum: [
            "to_do",
            "on_progress",
            "review",
            "revision",
            "approved",
            "scheduled",
            "published",
            "overdue",
          ],
        },
        ContentStatus: {
          type: "string",
          enum: [
            "draft",
            "assigned",
            "on_progress",
            "review",
            "revision",
            "approved",
            "published",
            "overdue",
          ],
        },

        // ─ Auth ───────────────────────────────────────────────────
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "superadmin@sejajar.id",
            },
            password: {
              type: "string",
              format: "password",
              example: "Admin@12345",
            },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/UserProfile" },
            accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
            refreshToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIs...",
            },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          required: ["refresh_token"],
          properties: {
            refresh_token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIs...",
            },
          },
        },

        // ─ User ───────────────────────────────────────────────────
        UserProfile: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            full_name: { type: "string", example: "Super Admin" },
            email: { type: "string", example: "superadmin@sejajar.id" },
            roles: {
              type: "array",
              items: { $ref: "#/components/schemas/UserRole" },
              example: ["superadmin"],
              description: "Daftar role user (many-to-many)",
            },
            role: {
              $ref: "#/components/schemas/UserRole",
              description:
                "Role utama (prioritas tertinggi) — untuk backward compatibility",
            },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateUserRequest: {
          type: "object",
          required: ["full_name", "email", "password", "roles"],
          properties: {
            full_name: { type: "string", example: "John Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@sejajar.id",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "Password@123",
            },
            roles: {
              type: "array",
              minItems: 1,
              items: { $ref: "#/components/schemas/UserRole" },
              example: ["content_editor"],
              description: "Daftar role untuk user baru (bisa lebih dari satu)",
            },
          },
        },
        UpdateUserRequest: {
          type: "object",
          properties: {
            full_name: { type: "string", example: "John Doe Updated" },
            email: { type: "string", format: "email" },
            password: { type: "string", format: "password", minLength: 8 },
            roles: {
              type: "array",
              minItems: 1,
              items: { $ref: "#/components/schemas/UserRole" },
              example: ["content_editor", "script_writer"],
              description:
                "Daftar role baru — akan menggantikan semua role lama",
            },
          },
        },

        // ─ Client ─────────────────────────────────────────────────
        Client: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            client_name: { type: "string", example: "Budi Santoso" },
            company_name: { type: "string", example: "PT Maju Bersama" },
            contact_email: {
              type: "string",
              example: "budi@majubersama.co.id",
            },
            contact_phone: { type: "string", example: "081234567890" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateClientRequest: {
          type: "object",
          required: ["client_name"],
          properties: {
            client_name: { type: "string", example: "Budi Santoso" },
            company_name: { type: "string", example: "PT Maju Bersama" },
            contact_email: {
              type: "string",
              format: "email",
              example: "budi@majubersama.co.id",
            },
            contact_phone: { type: "string", example: "081234567890" },
          },
        },

        // ─ Platform ───────────────────────────────────────────────
        Platform: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            platform_name: { type: "string", example: "Instagram" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreatePlatformRequest: {
          type: "object",
          required: ["platform_name"],
          properties: {
            platform_name: {
              type: "string",
              maxLength: 100,
              example: "Instagram",
            },
          },
        },
        UpdatePlatformRequest: {
          type: "object",
          properties: {
            platform_name: {
              type: "string",
              maxLength: 100,
              example: "Instagram Reels",
            },
          },
        },

        // ─ Content Type / Category ───────────────────────────────────────────
        ContentCategory: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            type_name: { type: "string", example: "tutorial" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateContentCategoryRequest: {
          type: "object",
          required: ["type_name"],
          properties: {
            type_name: {
              type: "string",
              maxLength: 100,
              example: "tutorial",
            },
          },
        },
        UpdateContentCategoryRequest: {
          type: "object",
          properties: {
            type_name: {
              type: "string",
              maxLength: 100,
              example: "tutorial_v2",
            },
          },
        },

        // ─ Pillar ─────────────────────────────────────────────────
        Pillar: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            pillar_name: { type: "string", example: "Brand Awareness" },
            description: {
              type: "string",
              example: "Content untuk membangun brand awareness",
              nullable: true,
            },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreatePillarRequest: {
          type: "object",
          required: ["pillar_name"],
          properties: {
            pillar_name: {
              type: "string",
              maxLength: 100,
              example: "Brand Awareness",
            },
            description: {
              type: "string",
              maxLength: 1000,
              example: "Content untuk membangun brand awareness",
            },
          },
        },
        UpdatePillarRequest: {
          type: "object",
          description:
            "Update pillar (field yang dikirim akan diupdate, field yang tidak dikirim tetap)",
          properties: {
            pillar_name: {
              type: "string",
              maxLength: 100,
              example: "Brand Awareness & Reputation Management",
            },
            description: {
              type: "string",
              maxLength: 1000,
              example:
                "Konten untuk membangun awareness dan reputasi brand di semua channel digital",
            },
          },
          example: {
            pillar_name: "Brand Awareness",
          },
        },

        // ─ Contract ───────────────────────────────────────────────
        Contract: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            client_id: { type: "integer", example: 1 },
            client_name: { type: "string", example: "PT Maju Bersama" },
            contract_code: { type: "string", example: "CTR-2025-001" },
            contract_name: { type: "string", example: "Campaign Ramadan 2025" },
            description: {
              type: "string",
              example: "Kampanye sosmed bulan Ramadan",
            },
            start_date: {
              type: "string",
              format: "date",
              example: "2025-03-01",
            },
            end_date: { type: "string", format: "date", example: "2025-04-15" },
            revenue: { type: "number", example: 25000000 },
            status: { $ref: "#/components/schemas/ContractStatus" },
            created_by: { type: "integer", example: 1 },
            created_by_name: { type: "string", example: "Super Admin" },
            lead_by: { type: "integer", example: 2 },
            lead_by_name: { type: "string", example: "Owner Sejajar" },
            platforms: { type: "array", items: { type: "object" } },
            teams: { type: "array", items: { type: "object" } },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateContractRequest: {
          type: "object",
          required: ["client_id", "contract_code", "contract_name", "lead_by"],
          properties: {
            client_id: { type: "integer", example: 1 },
            contract_code: { type: "string", example: "CTR-2025-001" },
            contract_name: { type: "string", example: "Campaign Ramadan 2025" },
            description: {
              type: "string",
              example: "Kampanye sosmed bulan Ramadan",
            },
            start_date: {
              type: "string",
              format: "date",
              example: "2025-03-01",
            },
            end_date: { type: "string", format: "date", example: "2025-04-15" },
            revenue: { type: "number", example: 25000000 },
            lead_by: { type: "integer", example: 2 },
            platform_ids: {
              type: "array",
              items: { type: "integer" },
              example: [1, 2],
            },
            team_user_ids: {
              type: "array",
              items: { type: "integer" },
              example: [3, 4, 5],
            },
          },
        },
        UpdateContractRequest: {
          type: "object",
          properties: {
            contract_name: {
              type: "string",
              example: "Campaign Ramadan 2025 - Revisi",
            },
            description: { type: "string" },
            start_date: {
              type: "string",
              format: "date",
              example: "2025-03-01",
            },
            end_date: { type: "string", format: "date", example: "2025-04-15" },
            revenue: { type: "number", example: 30000000 },
            lead_by: { type: "integer", example: 2 },
            status: {
              $ref: "#/components/schemas/ContractStatus",
              example: "active",
            },
            platform_ids: { type: "array", items: { type: "integer" } },
            team_user_ids: { type: "array", items: { type: "integer" } },
          },
        },

        // ─ Task ───────────────────────────────────────────────────
        Task: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            content_id: { type: "integer", example: 1 },
            content_title: {
              type: "string",
              example: "Tips Produktif di Bulan Ramadan",
            },
            assigned_to: { type: "integer", example: 5 },
            assignee_name: { type: "string", example: "Script Writer" },
            contract_id: { type: "integer", example: 1 },
            contract_name: { type: "string", example: "Campaign Ramadan 2025" },
            title: { type: "string", example: "Buat script konten reels" },
            description: {
              type: "string",
              example: "Script untuk 5 video reels",
            },
            deadline: { type: "string", format: "date", example: "2025-03-10" },
            status: { $ref: "#/components/schemas/TaskStatus" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateTaskRequest: {
          type: "object",
          required: ["content_id", "assigned_to", "title"],
          properties: {
            content_id: { type: "integer", example: 1 },
            assigned_to: { type: "integer", example: 5 },
            title: { type: "string", example: "Buat script konten reels" },
            description: {
              type: "string",
              example: "Script untuk 5 video reels",
            },
            deadline: { type: "string", format: "date", example: "2025-03-10" },
          },
        },
        UpdateTaskRequest: {
          type: "object",
          properties: {
            title: {
              type: "string",
              example: "Buat 10 script reels edukasi - Extended",
            },
            description: { type: "string" },
            deadline: { type: "string", format: "date", example: "2025-03-15" },
            assigned_to: { type: "integer", example: 4 },
            status: {
              $ref: "#/components/schemas/TaskStatus",
              example: "on_progress",
            },
          },
        },

        // ─ Content ────────────────────────────────────────────────
        Content: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            contract_id: { type: "integer", example: 1 },
            contract_name: { type: "string", example: "Campaign Ramadan 2025" },
            platform_id: { type: "integer", example: 1 },
            platform_name: { type: "string", example: "Instagram" },
            content_category_id: { type: "integer", example: 2 },
            category_name: { type: "string", example: "Reels" },
            pillar_id: { type: "integer", example: 1 },
            pillar_name: { type: "string", example: "Brand Awareness" },
            title: {
              type: "string",
              example: "Tips Produktif di Bulan Ramadan",
            },
            content_url: {
              type: "string",
              example: "https://drive.google.com/...",
              nullable: true,
            },
            description: {
              type: "string",
              example: "Deskripsi konten untuk sosmed",
              nullable: true,
            },
            objective: {
              type: "string",
              example: "Meningkatkan engagement Instagram",
              nullable: true,
            },
            target_audience: {
              type: "string",
              example: "Usia 18-35, pekerja kantoran",
              nullable: true,
            },
            due_date: {
              type: "string",
              format: "date",
              nullable: true,
            },
            priority: { $ref: "#/components/schemas/ContentPriority" },
            status: { $ref: "#/components/schemas/ContentStatus" },
            published_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateContentRequest: {
          type: "object",
          required: [
            "contract_id",
            "platform_id",
            "content_category_id",
            "pillar_id",
            "title",
          ],
          properties: {
            contract_id: { type: "integer", example: 1 },
            platform_id: { type: "integer", example: 1 },
            content_category_id: { type: "integer", example: 2 },
            pillar_id: { type: "integer", example: 1 },
            title: {
              type: "string",
              example: "Tips Produktif di Bulan Ramadan",
            },
            content_url: {
              type: "string",
              example: "https://drive.google.com/...",
            },
            description: { type: "string", example: "Deskripsi konten" },
            objective: {
              type: "string",
              example: "Meningkatkan engagement Instagram",
            },
            target_audience: { type: "string", example: "Usia 18-35" },
            due_date: {
              type: "string",
              format: "date",
              example: "2025-03-15",
            },
            priority: { $ref: "#/components/schemas/ContentPriority" },
          },
        },
        UpdateContentRequest: {
          type: "object",
          description:
            "Update content (field yang dikirim akan diupdate, field yang tidak dikirim tetap)",
          properties: {
            title: {
              type: "string",
              example: "Tips Produktif di Bulan Ramadan - Edisi Lengkap",
            },
            platform_id: { type: "integer", example: 1 },
            content_category_id: { type: "integer", example: 2 },
            pillar_id: { type: "integer", example: 1 },
            content_url: {
              type: "string",
              example: "https://drive.google.com/file/d/1ramadan-tips-final",
            },
            description: {
              type: "string",
              example:
                "Tingkatkan produktivitas Anda dengan tips-tips praktis selama Ramadan! 💪 #Ramadan2025",
            },
            objective: {
              type: "string",
              example: "Meningkatkan engagement Instagram",
            },
            target_audience: { type: "string", example: "Usia 18-35" },
            due_date: {
              type: "string",
              format: "date",
              example: "2025-03-08",
            },
            priority: { $ref: "#/components/schemas/ContentPriority" },
            status: {
              $ref: "#/components/schemas/ContentStatus",
              example: "approved",
            },
          },
          example: {
            status: "approved",
            description: "Tingkatkan produktivitas Anda selama Ramadan! 💪",
          },
        },

        // ─ Review ─────────────────────────────────────────────────
        Review: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            content_id: { type: "integer", example: 1 },
            content_title: {
              type: "string",
              example: "Tips Produktif di Bulan Ramadan",
            },
            reviewer_id: { type: "integer", example: 3 },
            reviewer_name: { type: "string", example: "Content Lead" },
            feedback: {
              type: "string",
              example: "Revisi bagian intro agar lebih menarik",
            },
            reviewed_at: { type: "string", format: "date-time" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateReviewRequest: {
          type: "object",
          required: ["content_id", "feedback"],
          properties: {
            content_id: { type: "integer", example: 1 },
            feedback: {
              type: "string",
              example: "Revisi bagian intro agar lebih menarik",
            },
          },
        },

        // ─ Task Output ────────────────────────────────────────────
        TaskOutput: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            task_id: { type: "integer", example: 1 },
            task_title: { type: "string", example: "Buat script konten reels" },
            caption: {
              type: "string",
              example: "Caption untuk Instagram Reels #Ramadan2025",
            },
            hashtag: {
              type: "string",
              example: "#Ramadan2025 #Produktif",
              nullable: true,
            },
            file_url: {
              type: "string",
              example: "https://drive.google.com/...",
              nullable: true,
            },
            version: { type: "integer", example: 2 },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateTaskOutputRequest: {
          type: "object",
          required: ["task_id", "caption"],
          properties: {
            task_id: { type: "integer", example: 1 },
            caption: {
              type: "string",
              example: "Caption untuk Instagram Reels #Ramadan2025",
            },
            hashtag: { type: "string", example: "#Ramadan2025 #Produktif" },
            file_url: {
              type: "string",
              example: "https://drive.google.com/...",
            },
          },
        },

        // ─ Task Comment ───────────────────────────────────────────
        TaskComment: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            task_id: { type: "integer", example: 1 },
            task_title: { type: "string", example: "Buat script konten reels" },
            user_id: { type: "integer", example: 5 },
            user_name: { type: "string", example: "Script Writer" },
            message: {
              type: "string",
              example: "Mohon dikirim scriptnya hari ini ya",
            },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateTaskCommentRequest: {
          type: "object",
          required: ["task_id", "message"],
          properties: {
            task_id: { type: "integer", example: 1 },
            message: {
              type: "string",
              example: "Mohon dikirim scriptnya hari ini ya",
            },
          },
        },

        // ─ Analytics ──────────────────────────────────────────────
        Engagement: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            content_id: { type: "integer", example: 1 },
            likes: { type: "integer", example: 250 },
            views: { type: "integer", example: 5000 },
            comments: { type: "integer", example: 45 },
            shares: { type: "integer", example: 12 },
            recorded_at: { type: "string", format: "date-time" },
          },
        },
        EngagementSummary: {
          type: "object",
          properties: {
            content_id: { type: "integer", example: 1 },
            total_likes: { type: "string", example: "1250" },
            total_views: { type: "string", example: "25000" },
            total_comments: { type: "string", example: "120" },
            total_shares: { type: "string", example: "45" },
            total_records: { type: "string", example: "5" },
            first_recorded: { type: "string", format: "date-time" },
            last_recorded: { type: "string", format: "date-time" },
          },
        },
        RecordEngagementRequest: {
          type: "object",
          required: ["content_id"],
          properties: {
            content_id: { type: "integer", example: 1 },
            likes: { type: "integer", minimum: 0, example: 250 },
            views: { type: "integer", minimum: 0, example: 5000 },
            comments: { type: "integer", minimum: 0, example: 45 },
            shares: { type: "integer", minimum: 0, example: 12 },
          },
        },
        TopContent: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            title: {
              type: "string",
              example: "Tips Produktif di Bulan Ramadan",
            },
            contract_id: { type: "integer", example: 1 },
            contract_name: { type: "string", example: "Campaign Ramadan 2025" },
            status: { $ref: "#/components/schemas/ContentStatus" },
            total_views: { type: "string", example: "25000" },
            total_likes: { type: "string", example: "1250" },
          },
        },

        // ─ Portfolio ──────────────────────────────────────────────
        PortfolioItem: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            is_featured: { type: "boolean", example: true },
            display_order: { type: "integer", example: 1, nullable: true },
            created_at: { type: "string", format: "date-time" },
            content_id: { type: "integer", example: 5 },
            title: {
              type: "string",
              example: "Tips Produktif di Bulan Ramadan",
            },
            content_url: {
              type: "string",
              example: "https://drive.google.com/...",
            },
            description: { type: "string", example: "Deskripsi konten" },
            published_at: { type: "string", format: "date-time" },
            status: { $ref: "#/components/schemas/ContentStatus" },
            contract_name: { type: "string", example: "Campaign Ramadan 2025" },
            category_name: { type: "string", example: "Reels" },
          },
        },
        CreatePortfolioRequest: {
          type: "object",
          required: ["content_id"],
          properties: {
            content_id: { type: "integer", example: 5 },
            is_featured: { type: "boolean", example: true },
            display_order: { type: "integer", example: 1 },
          },
        },
        UpdatePortfolioRequest: {
          type: "object",
          description:
            "Update portfolio item (field yang dikirim akan diupdate, field yang tidak dikirim tetap)",
          properties: {
            is_featured: { type: "boolean", example: true },
            display_order: { type: "integer", example: 1 },
          },
          example: {
            is_featured: true,
            display_order: 1,
          },
        },

        // ─ Activity Log ──────────────────────────────────────────
        ActivityLog: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            user_id: { type: "integer", example: 3, nullable: true },
            user_name: {
              type: "string",
              example: "Diego Santos",
              nullable: true,
            },
            action: {
              type: "string",
              enum: [
                "CREATE",
                "UPDATE",
                "DELETE",
                "PUBLISH",
                "LOGIN",
                "LOGOUT",
              ],
              example: "UPDATE",
            },
            table_name: {
              type: "string",
              example: "core.contents",
              nullable: true,
            },
            record_id: { type: "integer", example: 5, nullable: true },
            old_values: {
              type: "string",
              example: '{"status":"draft"}',
              nullable: true,
            },
            new_values: {
              type: "string",
              example: '{"status":"published"}',
              nullable: true,
            },
            ip_address: {
              type: "string",
              example: "192.168.1.1",
              nullable: true,
            },
            user_agent: {
              type: "string",
              example: "Mozilla/5.0...",
              nullable: true,
            },
            created_at: { type: "string", format: "date-time" },
          },
        },

        // ─ Notification ──────────────────────────────────────────
        Notification: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            recipient_id: { type: "integer", example: 3 },
            sender_id: { type: "integer", example: 1, nullable: true },
            sender_name: { type: "string", example: "Admin", nullable: true },
            title: { type: "string", example: "Task Baru Diberikan" },
            message: {
              type: "string",
              example:
                "Anda mendapatkan task 'Review Konten Ramadan' dari Content Lead",
            },
            source_type: {
              type: "string",
              example: "task",
              description: "Tipe sumber: task, review, content, assignment",
            },
            source_id: { type: "integer", example: 5 },
            is_read: { type: "boolean", example: false },
            read_at: { type: "string", format: "date-time", nullable: true },
            created_at: { type: "string", format: "date-time" },
          },
        },

        // ─ Dashboard ──────────────────────────────────────────────
        DashboardRoleBreakdownItem: {
          type: "object",
          properties: {
            role: { type: "string", example: "content_lead" },
            count: { type: "integer", example: 4 },
          },
        },
        DashboardSummary: {
          type: "object",
          description: "Superadmin summary",
          properties: {
            users: {
              type: "object",
              properties: {
                total: { type: "integer", example: 32 },
                online: { type: "integer", example: 24 },
              },
            },
            roles: {
              type: "object",
              properties: {
                total: { type: "integer", example: 5 },
                breakdown: {
                  type: "array",
                  items: { $ref: "#/components/schemas/DashboardRoleBreakdownItem" },
                },
              },
            },
            sessions: {
              type: "object",
              properties: {
                active: { type: "integer", example: 12 },
              },
            },
          },
        },
        DashboardOwnerSummary: {
          type: "object",
          properties: {
            contracts: {
              type: "object",
              properties: {
                active: { type: "integer", example: 5 },
                total_revenue: { type: "number", example: 150000000 },
                by_status: {
                  type: "object",
                  properties: {
                    active: { type: "integer", example: 5 },
                    completed: { type: "integer", example: 3 },
                    overdue: { type: "integer", example: 1 },
                  },
                },
              },
            },
            users: {
              type: "object",
              properties: {
                total: { type: "integer", example: 20 },
              },
            },
            contents: {
              type: "object",
              properties: {
                published: { type: "integer", example: 45 },
              },
            },
            clients: {
              type: "object",
              properties: {
                total: { type: "integer", example: 10 },
              },
            },
          },
        },
        DashboardContentLeadSummary: {
          type: "object",
          properties: {
            contracts: {
              type: "object",
              properties: {
                active: { type: "integer", example: 5 },
              },
            },
            contents: {
              type: "object",
              properties: {
                total: { type: "integer", example: 48 },
                on_progress: { type: "integer", example: 12 },
                published: { type: "integer", example: 20 },
              },
            },
          },
        },
        DashboardStorage: {
          type: "object",
          properties: {
            used_mb: { type: "number", example: 450 },
            limit_mb: { type: "integer", example: 2048 },
            used_percent: { type: "number", example: 22.0 },
          },
        },
        DashboardSystem: {
          type: "object",
          properties: {
            uptime_seconds: { type: "integer", example: 86400 },
            storage: { $ref: "#/components/schemas/DashboardStorage" },
            sessions: {
              type: "object",
              properties: {
                active: { type: "integer", example: 12 },
                online_users: { type: "integer", example: 24 },
              },
            },
          },
        },
      },

      // ── Reusable Parameters ─────────────────────────────────────
      parameters: {
        IdParam: {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer", example: 1 },
          description: "ID resource",
        },
        LimitQuery: {
          in: "query",
          name: "limit",
          schema: { type: "integer", default: 20, maximum: 100 },
          description: "Jumlah data per halaman",
        },
        OffsetQuery: {
          in: "query",
          name: "offset",
          schema: { type: "integer", default: 0 },
          description: "Mulai dari index ke-n",
        },
      },

      // ── Reusable Responses ──────────────────────────────────────
      responses: {
        Unauthorized: {
          description: "Token tidak valid atau sudah expired",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { status: "error", message: "Access token expired" },
            },
          },
        },
        Forbidden: {
          description: "Tidak memiliki izin akses",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                status: "error",
                message: "Forbidden: insufficient permissions",
              },
            },
          },
        },
        NotFound: {
          description: "Resource tidak ditemukan",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { status: "error", message: "Resource not found" },
            },
          },
        },
        ValidationError: {
          description: "Data request tidak valid",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
            },
          },
        },
        InternalError: {
          description: "Server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { status: "error", message: "Internal Server Error" },
            },
          },
        },
      },
    },

    // ── Tags (urutan tampil di UI) ───────────────────────────────
    tags: [
      { name: "Auth", description: "Autentikasi & manajemen session" },
      { name: "Users", description: "Manajemen user sistem" },
      { name: "Clients", description: "Manajemen data klien" },
      { name: "Contracts", description: "Manajemen kontrak klien" },
      { name: "Contents", description: "Manajemen konten & workflow review" },
      { name: "Platforms", description: "Manajemen platform sosial media" },
      { name: "Content Categories", description: "Manajemen kategori konten" },
      { name: "Pillars", description: "Manajemen content pillar" },
      { name: "Tasks", description: "Manajemen task per konten" },
      { name: "Task Outputs", description: "Output/hasil pengerjaan task" },
      { name: "Task Comments", description: "Komentar & diskusi per task" },
      { name: "Reviews", description: "Review & approval konten" },
      { name: "Analytics", description: "Data engagement & performa konten" },
      { name: "Portfolio", description: "Manajemen portfolio publik" },
      { name: "Activity Logs", description: "Log aktivitas & audit trail" },
      { name: "Notifications", description: "Notifikasi & pemberitahuan user" },
      { name: "Dashboard", description: "Metric & widget dashboard per role" },
    ],
  },

  // Lokasi file route yang berisi JSDoc @swagger
  apis: [path.join(__dirname, "../modules/**/*.routes.js").replace(/\\/g, "/")],
};

const swaggerSpec = swaggerJsdoc(options);

export const swaggerUiOptions = {
  customSiteTitle: "Sejajar API Docs",
  customCss: `
    .swagger-ui .topbar { background-color: #1a1a2e; }
    .swagger-ui .topbar-wrapper img { display: none; }
    .swagger-ui .topbar-wrapper::after {
      content: 'Sejajar API Documentation';
      color: white;
      font-size: 1.2rem;
      font-weight: bold;
    }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
};

export default swaggerSpec;
