export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;
type DateString = string;

export type Database = {
  public: {
    Tables: {
      semesters: {
        Row: {
          id: string;
          name: string;
          starts_on: DateString;
          ends_on: DateString;
          is_active: boolean;
          archived_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          name: string;
          starts_on: DateString;
          ends_on: DateString;
          is_active?: boolean;
          archived_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["semesters"]["Insert"]>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          slug: string;
          name: string;
          is_active: boolean;
          sort_order: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
      event_types: {
        Row: {
          slug: string;
          label: string;
          color_token: string;
          icon_key: string;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          slug: string;
          label: string;
          color_token: string;
          icon_key: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["event_types"]["Insert"]>;
        Relationships: [];
      };
      editor_access: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          role: "admin" | "editor";
          is_active: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          email: string;
          display_name?: string | null;
          role: "admin" | "editor";
          is_active?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["editor_access"]["Insert"]
        >;
        Relationships: [];
      };
      event_series: {
        Row: {
          id: string;
          semester_id: string;
          rule: Json;
          title_snapshot: string;
          created_by_email: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          semester_id: string;
          rule: Json;
          title_snapshot: string;
          created_by_email: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["event_series"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "event_series_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          semester_id: string;
          series_id: string | null;
          occurrence_index: number | null;
          title: string;
          starts_at: Timestamp;
          ends_at: Timestamp | null;
          all_day: boolean;
          type_slug: string;
          status: string;
          location_name: string | null;
          meeting_url: string | null;
          responsible: string | null;
          description: string | null;
          change_note: string | null;
          change_visible_until: Timestamp | null;
          is_important: boolean;
          created_by_email: string;
          updated_by_email: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          semester_id: string;
          series_id?: string | null;
          occurrence_index?: number | null;
          title: string;
          starts_at: Timestamp;
          ends_at?: Timestamp | null;
          all_day?: boolean;
          type_slug: string;
          status: string;
          location_name?: string | null;
          meeting_url?: string | null;
          responsible?: string | null;
          description?: string | null;
          change_note?: string | null;
          change_visible_until?: Timestamp | null;
          is_important?: boolean;
          created_by_email: string;
          updated_by_email: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "events_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "event_series";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_type_slug_fkey";
            columns: ["type_slug"];
            isOneToOne: false;
            referencedRelation: "event_types";
            referencedColumns: ["slug"];
          },
        ];
      };
      event_projects: {
        Row: {
          event_id: string;
          project_id: string;
        };
        Insert: {
          event_id: string;
          project_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["event_projects"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "event_projects_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_projects_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      event_links: {
        Row: {
          id: string;
          event_id: string;
          label: string;
          url: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          event_id: string;
          label: string;
          url: string;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["event_links"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "event_links_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          id: string;
          semester_id: string;
          title: string;
          body: string;
          severity: "info" | "warning" | "critical";
          starts_at: Timestamp;
          ends_at: Timestamp | null;
          related_event_id: string | null;
          is_published: boolean;
          created_by_email: string;
          updated_by_email: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          semester_id: string;
          title: string;
          body: string;
          severity: "info" | "warning" | "critical";
          starts_at: Timestamp;
          ends_at?: Timestamp | null;
          related_event_id?: string | null;
          is_published?: boolean;
          created_by_email: string;
          updated_by_email: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<
          Database["public"]["Tables"]["announcements"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "announcements_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcements_related_event_id_fkey";
            columns: ["related_event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      active_semester_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      activate_semester: {
        Args: { target_semester_id: string };
        Returns: void;
      };
      archive_active_semester: {
        Args: { target_semester_id: string };
        Returns: void;
      };
      current_user_email: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_editor: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
