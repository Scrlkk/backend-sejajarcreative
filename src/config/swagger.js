import swaggerJsdoc from "swagger-jsdoc";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sejajar CMS API",
      version: "1.0.0",
      description: `
## Sejajar Content Management System — REST API

API ini digunakan untuk mengelola seluruh operasional konten, project, tim, dan analytics.

### Autentikasi
Semua endpoint (kecuali \`/auth/login\`) membutuhkan **Bearer Token**.

1. Login melalui \`POST /api/auth/login\`
2. Salin \`accessToken\` dari response
3. Klik tombol **Authorize** di atas, masukkan: \`Bearer <accessToken>\`

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
      {
        url: "https://api.sejajar.id",
        description: "Production server",
      },
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
        ProjectStatus: {
          type: "string",
          enum: ["planning", "ongoing", "review", "completed", "cancelled"],
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

        // ─ Project ────────────────────────────────────────────────
        Project: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            client_id: { type: "integer", example: 1 },
            client_name: { type: "string", example: "PT Maju Bersama" },
            project_name: { type: "string", example: "Campaign Ramadan 2025" },
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
            status: { $ref: "#/components/schemas/ProjectStatus" },
            created_by: { type: "integer", example: 1 },
            created_by_name: { type: "string", example: "Owner Sejajar" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        CreateProjectRequest: {
          type: "object",
          required: ["client_id", "project_name"],
          properties: {
            client_id: { type: "integer", example: 1 },
            project_name: { type: "string", example: "Campaign Ramadan 2025" },
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
        UpdateProjectRequest: {
          type: "object",
          properties: {
            project_name: { type: "string" },
            description: { type: "string" },
            start_date: { type: "string", format: "date" },
            end_date: { type: "string", format: "date" },
            status: { $ref: "#/components/schemas/ProjectStatus" },
          },
        },
        ProjectMember: {
          type: "object",
          properties: {
            project_id: { type: "integer", example: 1 },
            user_id: { type: "integer", example: 3 },
            full_name: { type: "string", example: "Content Lead" },
            email: { type: "string", example: "contentlead@sejajar.id" },
            role: { $ref: "#/components/schemas/UserRole" },
            role_in_project: { type: "string", example: "Lead Konten Ramadan" },
          },
        },
        AddMemberRequest: {
          type: "object",
          required: ["user_id"],
          properties: {
            user_id: { type: "integer", example: 3 },
            role_in_project: { type: "string", example: "Lead Konten Ramadan" },
          },
        },

        // ─ Task ───────────────────────────────────────────────────
        Task: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            project_id: { type: "integer", example: 1 },
            project_name: { type: "string", example: "Campaign Ramadan 2025" },
            title: { type: "string", example: "Buat script konten reels" },
            description: {
              type: "string",
              example: "Script untuk 5 video reels",
            },
            assigned_to: { type: "integer", example: 4 },
            assignee_name: { type: "string", example: "Script Writer" },
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
          required: ["project_id", "title"],
          properties: {
            project_id: { type: "integer", example: 1 },
            title: { type: "string", example: "Buat script konten reels" },
            description: {
              type: "string",
              example: "Script untuk 5 video reels",
            },
            assigned_to: { type: "integer", example: 4 },
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
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            assigned_to: { type: "integer" },
            start_date: { type: "string", format: "date" },
            due_date: { type: "string", format: "date" },
            status: { $ref: "#/components/schemas/TaskStatus" },
          },
        },

        // ─ Content ────────────────────────────────────────────────
        Content: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            project_id: { type: "integer", example: 1 },
            project_name: { type: "string", example: "Campaign Ramadan 2025" },
            task_id: { type: "integer", example: 1, nullable: true },
            task_title: {
              type: "string",
              example: "Buat script konten reels",
              nullable: true,
            },
            content_pillar_id: { type: "integer", example: 1, nullable: true },
            pillar_name: { type: "string", example: "Edukasi", nullable: true },
            title: {
              type: "string",
              example: "Tips Produktif di Bulan Ramadan",
            },
            file_url: {
              type: "string",
              example: "https://drive.google.com/...",
              nullable: true,
            },
            caption: {
              type: "string",
              example: "Caption untuk sosmed",
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
          required: ["project_id", "title"],
          properties: {
            project_id: { type: "integer", example: 1 },
            task_id: { type: "integer", example: 1, nullable: true },
            content_pillar_id: { type: "integer", example: 1, nullable: true },
            title: {
              type: "string",
              example: "Tips Produktif di Bulan Ramadan",
            },
            file_url: {
              type: "string",
              example: "https://drive.google.com/...",
            },
            caption: { type: "string", example: "Caption untuk sosmed" },
            publish_date: {
              type: "string",
              format: "date-time",
              example: "2025-03-15T09:00:00Z",
            },
          },
        },
        UpdateContentRequest: {
          type: "object",
          properties: {
            title: { type: "string" },
            task_id: { type: "integer", nullable: true },
            content_pillar_id: { type: "integer", nullable: true },
            file_url: { type: "string" },
            caption: { type: "string" },
            publish_date: { type: "string", format: "date-time" },
            status: { $ref: "#/components/schemas/ContentStatus" },
          },
        },

        // ─ Review ─────────────────────────────────────────────────
        Review: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            content_id: { type: "integer", example: 1 },
            reviewer_id: { type: "integer", example: 3 },
            reviewer_name: { type: "string", example: "Content Lead" },
            reviewer_role: { $ref: "#/components/schemas/UserRole" },
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
            comments: { type: "integer", example: 45 },
            views: { type: "integer", example: 5000 },
            shares: { type: "integer", example: 120 },
            recorded_at: { type: "string", format: "date-time" },
          },
        },
        EngagementSummary: {
          type: "object",
          properties: {
            content_id: { type: "integer", example: 1 },
            total_likes: { type: "string", example: "1250" },
            total_comments: { type: "string", example: "230" },
            total_views: { type: "string", example: "25000" },
            total_shares: { type: "string", example: "600" },
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
            comments: { type: "integer", minimum: 0, example: 45 },
            views: { type: "integer", minimum: 0, example: 5000 },
            shares: { type: "integer", minimum: 0, example: 120 },
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
            project_id: { type: "integer", example: 1 },
            project_name: { type: "string", example: "Campaign Ramadan 2025" },
            status: { $ref: "#/components/schemas/ContentStatus" },
            total_views: { type: "string", example: "25000" },
            total_likes: { type: "string", example: "1250" },
            total_comments: { type: "string", example: "230" },
            total_shares: { type: "string", example: "600" },
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
            caption: { type: "string", example: "Caption untuk sosmed" },
            published_at: { type: "string", format: "date-time" },
            status: { $ref: "#/components/schemas/ContentStatus" },
            pillar_name: { type: "string", example: "Edukasi", nullable: true },
            project_name: { type: "string", example: "Campaign Ramadan 2025" },
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
          properties: {
            is_featured: { type: "boolean", example: false },
            display_order: { type: "integer", example: 2 },
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
      { name: "Projects", description: "Manajemen project & anggota tim" },
      { name: "Tasks", description: "Manajemen task dalam project" },
      { name: "Contents", description: "Manajemen konten & workflow review" },
      { name: "Reviews", description: "Review & approval konten" },
      { name: "Analytics", description: "Data engagement & performa konten" },
      { name: "Portfolio", description: "Manajemen portfolio publik" },
    ],
  },

  // Lokasi file route yang berisi JSDoc @swagger
  apis: [path.join(__dirname, "../modules/**/*.routes.js")],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
