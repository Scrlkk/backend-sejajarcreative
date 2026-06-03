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
          enum: ["planning", "ongoing", "review", "completed", "cancelled"],
        },
        AssignmentRole: {
          type: "string",
          enum: ["scriptwriter", "content_editor", "social_media_admin"],
        },
        TaskStatus: {
          type: "string",
          enum: ["pending", "in_progress", "review", "done"],
        },
        ContentStatus: {
          type: "string",
          enum: ["draft", "in_review", "approved", "published"],
        },
        ReviewStatus: {
          type: "string",
          enum: ["revision", "approved"],
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
            role: { $ref: "#/components/schemas/UserRole" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateUserRequest: {
          type: "object",
          required: ["full_name", "email", "password", "role"],
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
            role: { $ref: "#/components/schemas/UserRole" },
          },
        },
        UpdateUserRequest: {
          type: "object",
          properties: {
            full_name: { type: "string", example: "John Doe Updated" },
            email: { type: "string", format: "email" },
            password: { type: "string", format: "password", minLength: 8 },
            role: { $ref: "#/components/schemas/UserRole" },
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

        // ─ Content Type ───────────────────────────────────────────
        ContentType: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            type_name: { type: "string", example: "Reels" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateContentTypeRequest: {
          type: "object",
          required: ["type_name"],
          properties: {
            type_name: {
              type: "string",
              maxLength: 100,
              example: "Reels",
            },
          },
        },
        UpdateContentTypeRequest: {
          type: "object",
          properties: {
            type_name: {
              type: "string",
              maxLength: 100,
              example: "Reels Video",
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
            status: { $ref: "#/components/schemas/ContractStatus" },
            created_by: { type: "integer", example: 1 },
            created_by_name: { type: "string", example: "Owner Sejajar" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateContractRequest: {
          type: "object",
          required: ["client_id", "contract_name"],
          properties: {
            client_id: { type: "integer", example: 1 },
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
          },
        },
        UpdateContractRequest: {
          type: "object",
          description:
            "Update contract (field yang dikirim akan diupdate, field yang tidak dikirim tetap)",
          properties: {
            contract_name: {
              type: "string",
              example: "Campaign Ramadan 2025 - Revisi",
            },
            description: {
              type: "string",
              example:
                "Kampanye marketing komprehensif dengan fokus pada edukasi dan engagement",
            },
            start_date: {
              type: "string",
              format: "date",
              example: "2025-03-01",
            },
            end_date: {
              type: "string",
              format: "date",
              example: "2025-04-15",
            },
            status: {
              $ref: "#/components/schemas/ContractStatus",
              example: "ongoing",
            },
          },
          example: {
            contract_name: "Campaign Ramadan 2025 - Revisi",
            status: "ongoing",
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
            pillar_id: { type: "integer", example: 1 },
            pillar_name: { type: "string", example: "Edukasi" },
            contract_id: { type: "integer", example: 1 },
            contract_name: { type: "string", example: "Campaign Ramadan 2025" },
            title: { type: "string", example: "Buat script konten reels" },
            description: {
              type: "string",
              example: "Script untuk 5 video reels",
            },
            start_date: {
              type: "string",
              format: "date",
              example: "2025-03-01",
            },
            due_date: { type: "string", format: "date", example: "2025-03-10" },
            status: { $ref: "#/components/schemas/TaskStatus" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateTaskRequest: {
          type: "object",
          required: ["content_id", "pillar_id", "title"],
          properties: {
            content_id: { type: "integer", example: 1 },
            pillar_id: { type: "integer", example: 1 },
            title: { type: "string", example: "Buat script konten reels" },
            description: {
              type: "string",
              example: "Script untuk 5 video reels",
            },
            start_date: {
              type: "string",
              format: "date",
              example: "2025-03-01",
            },
            due_date: { type: "string", format: "date", example: "2025-03-10" },
          },
        },
        UpdateTaskRequest: {
          type: "object",
          description:
            "Update task (field yang dikirim akan diupdate, field yang tidak dikirim tetap). Minimal harus ada 1 field yang diupdate.",
          properties: {
            title: {
              type: "string",
              example: "Buat 10 script reels edukasi - Extended",
            },
            description: {
              type: "string",
              example:
                "Script untuk 10 video reels tentang tips produktif dengan durasi 30-60 detik",
            },
            pillar_id: { type: "integer", example: 1 },
            start_date: {
              type: "string",
              format: "date",
              example: "2025-03-01",
            },
            due_date: {
              type: "string",
              format: "date",
              example: "2025-03-15",
            },
            status: {
              $ref: "#/components/schemas/TaskStatus",
              example: "in_progress",
            },
          },
          example: {
            status: "in_progress",
            due_date: "2025-03-15",
          },
        },

        // ─ Task Assignment ─────────────────────────────────────────
        TaskAssignment: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            task_id: { type: "integer", example: 1 },
            task_title: { type: "string", example: "Buat script konten reels" },
            assigned_to: { type: "integer", example: 5 },
            assigned_to_name: { type: "string", example: "Andi Scriptwriter" },
            assignment_role: { $ref: "#/components/schemas/AssignmentRole" },
            status: { $ref: "#/components/schemas/TaskStatus" },
            script_text: {
              type: "string",
              example: "Halo semuanya! Kali ini kita akan...",
              nullable: true,
            },
            file_url: {
              type: "string",
              example: "https://drive.google.com/file/d/abc123",
              nullable: true,
            },
            notes_from_admin: {
              type: "string",
              example: "Perhatikan tone yang lebih casual",
              nullable: true,
            },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateTaskAssignmentRequest: {
          type: "object",
          required: ["task_id", "assigned_to", "assignment_role"],
          properties: {
            task_id: { type: "integer", example: 1 },
            assigned_to: { type: "integer", example: 5 },
            assignment_role: { $ref: "#/components/schemas/AssignmentRole" },
            script_text: {
              type: "string",
              example: "Halo semuanya! Kali ini kita akan...",
            },
            file_url: {
              type: "string",
              example: "https://drive.google.com/file/d/abc123",
            },
            notes_from_admin: {
              type: "string",
              example: "Perhatikan tone yang lebih casual",
            },
          },
        },
        UpdateTaskAssignmentRequest: {
          type: "object",
          description:
            "Update penugasan task (field yang dikirim akan diupdate, field yang tidak dikirim tetap)",
          properties: {
            status: { $ref: "#/components/schemas/TaskStatus" },
            assignment_role: { $ref: "#/components/schemas/AssignmentRole" },
            assigned_to: { type: "integer", example: 6 },
          },
          example: {
            status: "in_progress",
          },
        },

        // ─ Content ────────────────────────────────────────────────
        Content: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            contract_id: { type: "integer", example: 1 },
            contract_name: { type: "string", example: "Campaign Ramadan 2025" },
            content_type_id: { type: "integer", example: 2 },
            type_name: { type: "string", example: "Reels" },
            platforms: { type: "array", items: { type: "object" } },
            title: {
              type: "string",
              example: "Tips Produktif di Bulan Ramadan",
            },
            file_url: {
              type: "string",
              example: "https://drive.google.com/...",
              nullable: true,
            },
            description: {
              type: "string",
              example: "Deskripsi konten untuk sosmed",
              nullable: true,
            },
            publish_date: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            published_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            status: { $ref: "#/components/schemas/ContentStatus" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateContentRequest: {
          type: "object",
          required: ["contract_id", "content_type_id", "title"],
          properties: {
            contract_id: { type: "integer", example: 1 },
            content_type_id: { type: "integer", example: 2 },
            platform_ids: {
              type: "array",
              items: { type: "integer" },
              example: [1, 2],
            },
            title: {
              type: "string",
              example: "Tips Produktif di Bulan Ramadan",
            },
            file_url: {
              type: "string",
              example: "https://drive.google.com/...",
            },
            description: { type: "string", example: "Deskripsi konten" },
            publish_date: {
              type: "string",
              format: "date-time",
              example: "2025-03-15T09:00:00Z",
            },
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
            content_type_id: { type: "integer", example: 2 },
            platform_ids: { type: "array", items: { type: "integer" } },
            file_url: {
              type: "string",
              example: "https://drive.google.com/file/d/1ramadan-tips-final",
            },
            description: {
              type: "string",
              example:
                "Tingkatkan produktivitas Anda dengan tips-tips praktis selama Ramadan! 💪 #Ramadan2025",
            },
            publish_date: {
              type: "string",
              format: "date-time",
              example: "2025-03-08T10:00:00Z",
            },
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
            task_assignment_id: { type: "integer", example: 1 },
            reviewer_id: { type: "integer", example: 3 },
            reviewer_name: { type: "string", example: "Content Lead" },
            feedback: {
              type: "string",
              example: "Revisi bagian intro agar lebih menarik",
            },
            status: { $ref: "#/components/schemas/ReviewStatus" },
            reviewed_at: { type: "string", format: "date-time" },
          },
        },
        CreateReviewRequest: {
          type: "object",
          required: ["feedback", "status"],
          properties: {
            feedback: {
              type: "string",
              example: "Revisi bagian intro agar lebih menarik",
            },
            status: { $ref: "#/components/schemas/ReviewStatus" },
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
            recorded_at: { type: "string", format: "date-time" },
          },
        },
        EngagementSummary: {
          type: "object",
          properties: {
            content_id: { type: "integer", example: 1 },
            total_likes: { type: "string", example: "1250" },
            total_views: { type: "string", example: "25000" },
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
            file_url: {
              type: "string",
              example: "https://drive.google.com/...",
            },
            description: { type: "string", example: "Deskripsi konten" },
            published_at: { type: "string", format: "date-time" },
            status: { $ref: "#/components/schemas/ContentStatus" },
            contract_name: { type: "string", example: "Campaign Ramadan 2025" },
            type_name: { type: "string", example: "Reels" },
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
      { name: "Content Types", description: "Manajemen jenis konten" },
      { name: "Pillars", description: "Manajemen content pillar" },
      { name: "Tasks", description: "Manajemen task per konten" },
      { name: "Task Assignments", description: "Penugasan tim per task" },
      { name: "Reviews", description: "Review & approval konten" },
      { name: "Analytics", description: "Data engagement & performa konten" },
      { name: "Portfolio", description: "Manajemen portfolio publik" },
    ],
  },

  // Lokasi file route yang berisi JSDoc @swagger
  apis: [path.join(__dirname, "../modules/**/*.routes.js").replace(/\\/g, "/")],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
