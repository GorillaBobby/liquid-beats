import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get admin user from JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: adminUser }, error: adminUserError } = await supabaseAdmin.auth.getUser(token);

    if (adminUserError || !adminUser) {
      throw new Error("Invalid admin token");
    }

    // Verify admin status
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUser.id)
      .eq("role", "admin")
      .single();

    if (roleError || !adminRole) {
      console.error("Unauthorized: User is not an admin");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Get target user ID from request body
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log(`Admin ${adminUser.id} deleting account for user: ${userId}`);

    // Get user's storage files before deletion
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    // Get user's tracks with storage files
    const { data: tracks } = await supabaseAdmin
      .from("tracks")
      .select("audio_url, cover_url")
      .eq("artist_id", userId);

    // Get user's albums with cover images
    const { data: albums } = await supabaseAdmin
      .from("albums")
      .select("cover_url")
      .eq("artist_id", userId);

    // Delete storage files
    const filesToDelete = [];
    
    // Delete avatar
    if (profile?.avatar_url) {
      const avatarPath = profile.avatar_url.split('/').pop();
      if (avatarPath) {
        filesToDelete.push({ bucket: 'cover-images', path: avatarPath });
      }
    }

    // Delete track files
    if (tracks) {
      for (const track of tracks) {
        if (track.audio_url) {
          const audioPath = track.audio_url.split('/').pop();
          if (audioPath) {
            filesToDelete.push({ bucket: 'audio-files', path: audioPath });
          }
        }
        if (track.cover_url) {
          const coverPath = track.cover_url.split('/').pop();
          if (coverPath) {
            filesToDelete.push({ bucket: 'cover-images', path: coverPath });
          }
        }
      }
    }

    // Delete album covers
    if (albums) {
      for (const album of albums) {
        if (album.cover_url) {
          const coverPath = album.cover_url.split('/').pop();
          if (coverPath) {
            filesToDelete.push({ bucket: 'cover-images', path: coverPath });
          }
        }
      }
    }

    // Delete files from storage
    for (const file of filesToDelete) {
      try {
        await supabaseAdmin.storage.from(file.bucket).remove([file.path]);
        console.log(`Deleted file: ${file.bucket}/${file.path}`);
      } catch (error) {
        console.error(`Error deleting file ${file.bucket}/${file.path}:`, error);
      }
    }

    // Log the deletion
    await supabaseAdmin.from("admin_logs").insert({
      event_type: "account_deleted",
      user_id: adminUser.id,
      details: {
        deleted_user_id: userId,
        deleted_by_admin: adminUser.email,
      }
    });

    // Delete the user account (will cascade delete related data due to foreign keys)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted user ${userId} and all associated data`);

    return new Response(
      JSON.stringify({ success: true, message: "Account and all data deleted successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in admin-delete-account function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
