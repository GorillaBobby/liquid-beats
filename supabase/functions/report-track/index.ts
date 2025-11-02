import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { trackId, reason, details } = await req.json();

    if (!trackId || !reason) {
      return new Response(
        JSON.stringify({ error: 'trackId et reason sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} reporting track ${trackId} for: ${reason}`);

    // Insert report
    const { data: report, error: reportError } = await supabase
      .from('track_reports')
      .insert({
        track_id: trackId,
        reporter_id: user.id,
        reason,
        details: details || null,
        status: 'pending',
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error creating report:', reportError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du signalement' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get track info
    const { data: track } = await supabase
      .from('tracks')
      .select('title')
      .eq('id', trackId)
      .single();

    // Get all admins
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      // Create notifications for all admins
      const notifications = admins.map((admin) => ({
        user_id: admin.user_id,
        type: 'track_report',
        title: 'Nouveau signalement',
        message: `Une piste "${track?.title || trackId}" a été signalée pour: ${reason}`,
        related_id: report.id,
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creating admin notifications:', notifError);
      } else {
        console.log(`Created ${notifications.length} admin notifications`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, report }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in report-track function:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
