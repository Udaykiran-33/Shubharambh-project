// ─── Email Templates for Shubharambh vendor notifications ───────────────────

/** Convert slug like 'sangeet-night' → 'Sangeet Night' */
function formatSlug(slug: string): string {
  if (!slug) return '';
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format Indian currency */
function formatINR(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

// ─── Quote / Enquiry Email ─────────────────────────────────────────────────────
export function quoteEnquiryEmail({
  vendorName,
  businessName,
  userName,
  userEmail,
  eventType,
  eventDate,
  location,
  attendees,
  budgetMin,
  budgetMax,
  requirements,
  notes,
  venueName,
  dashboardUrl,
}: {
  vendorName: string;
  businessName: string;
  userName: string;
  userEmail: string;
  eventType: string;
  eventDate: string;
  location: string;
  attendees?: number;
  budgetMin?: number;
  budgetMax?: number;
  requirements: string;
  notes?: string;
  venueName?: string;
  dashboardUrl: string;
}) {
  const formattedEvent = formatSlug(eventType);
  const showAttendees = attendees && attendees > 0;
  const hasBudget = budgetMin && budgetMax && budgetMin > 0 && budgetMax > 0;
  const budgetStr = hasBudget
    ? `${formatINR(budgetMin!)} – ${formatINR(budgetMax!)}`
    : null;

  // Build event detail rows (only include non-empty)
  const eventRows = [
    { label: '📅 Event Type',  value: formattedEvent },
    { label: '🗓️ Date',         value: eventDate },
    { label: '📍 Location',     value: formatSlug(location) },
    ...(showAttendees ? [{ label: '👥 Guests',  value: `${attendees} people` }] : []),
    ...(budgetStr      ? [{ label: '💰 Budget',  value: budgetStr }]            : []),
    ...(venueName      ? [{ label: '🏛️ For',     value: venueName }]            : []),
  ];

  const detailRows = eventRows
    .map(
      (r) => `
      <tr>
        <td style="padding:12px 24px;border-bottom:1px solid #f0ece3;width:40%;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#8a7a65;font-weight:600;white-space:nowrap;vertical-align:top;">
          ${r.label}
        </td>
        <td style="padding:12px 24px;border-bottom:1px solid #f0ece3;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#1e2a0e;font-weight:700;vertical-align:top;">
          ${r.value}
        </td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Quote Enquiry – Shubharambh</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ece5;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ece5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 48px rgba(60,45,10,0.13);">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#2d3d14 0%,#4a5c28 50%,#6b7c41 100%);padding:44px 48px 36px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:100px;color:rgba(255,255,255,0.9);font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;padding:6px 18px;margin-bottom:20px;">
                🔔 New Enquiry
              </div>
              <h1 style="margin:0 0 6px;color:#fff;font-size:32px;font-weight:800;letter-spacing:-0.5px;">
                ✨ Shubharambh
              </h1>
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;font-weight:400;">
                Your trusted wedding &amp; event planning platform
              </p>
            </td>
          </tr>

          <!-- ── GOLD ACCENT LINE ── -->
          <tr>
            <td style="height:5px;background:linear-gradient(to right,#c9a84c,#e8d060,#c9a84c);"></td>
          </tr>

          <!-- ── ALERT BANNER ── -->
          <tr>
            <td style="background:#fffbee;border-bottom:1px solid #f0d878;padding:16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:32px;vertical-align:middle;font-size:22px;">🎉</td>
                  <td style="padding-left:12px;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#7a5a08;line-height:1.6;">
                    <strong style="color:#5a4006;">You've received a new quote request!</strong>
                    &nbsp;A customer is interested in booking <strong>${venueName || businessName}</strong>.
                    Respond within 24 hours to secure the lead.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="padding:36px 48px 8px;">
              <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#1e2a0e;">
                Hello, ${vendorName}! 👋
              </p>
              <p style="margin:0;font-size:15px;color:#6b5e4a;line-height:1.75;">
                <strong style="color:#2c3a16;">${userName}</strong> has sent you a quote enquiry
                ${venueName ? `for <strong>${venueName}</strong>` : `for <strong>${businessName}</strong>`}.
                Here's everything you need to know:
              </p>
            </td>
          </tr>

          <!-- ── CUSTOMER CARD ── -->
          <tr>
            <td style="padding:20px 48px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #e0d8c8;border-radius:14px;overflow:hidden;">
                <tr>
                  <td colspan="2" style="background:linear-gradient(135deg,#f5f1e8,#ede6d6);padding:13px 24px;border-bottom:1px solid #e0d8c8;">
                    <span style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a6b35;">👤 &nbsp;Customer</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 24px;border-bottom:1px solid #f0ece3;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#8a7a65;font-weight:600;width:40%;white-space:nowrap;">Name</td>
                  <td style="padding:12px 24px;border-bottom:1px solid #f0ece3;font-size:15px;color:#1e2a0e;font-weight:800;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding:12px 24px;font-size:13px;color:#8a7a65;font-weight:600;">Email</td>
                  <td style="padding:12px 24px;font-size:14px;color:#4a5c28;font-weight:700;">
                    <a href="mailto:${userEmail}" style="color:#4a5c28;text-decoration:none;">${userEmail}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── EVENT DETAILS CARD ── -->
          <tr>
            <td style="padding:12px 48px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #e0d8c8;border-radius:14px;overflow:hidden;">
                <tr>
                  <td colspan="2" style="background:linear-gradient(135deg,#f5f1e8,#ede6d6);padding:13px 24px;border-bottom:1px solid #e0d8c8;">
                    <span style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a6b35;">🎊 &nbsp;Event Details</span>
                  </td>
                </tr>
                ${detailRows}
              </table>
            </td>
          </tr>

          <!-- ── REQUIREMENTS CARD ── -->
          <tr>
            <td style="padding:12px 48px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #e0d8c8;border-radius:14px;overflow:hidden;">
                <tr>
                  <td style="background:linear-gradient(135deg,#f5f1e8,#ede6d6);padding:13px 24px;border-bottom:1px solid #e0d8c8;">
                    <span style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a6b35;">📋 &nbsp;Requirements</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 24px;font-size:15px;color:#2c3a16;line-height:1.9;font-weight:500;">
                    ${requirements}
                  </td>
                </tr>
                ${notes ? `
                <tr>
                  <td style="padding:0 24px 16px;">
                    <div style="background:#f9f6f0;border-left:3px solid #c9a84c;border-radius:4px;padding:12px 16px;font-size:13px;color:#7a6545;font-style:italic;line-height:1.7;">
                      💬 &nbsp;"${notes}"
                    </div>
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>

          <!-- ── CTA BUTTON ── -->
          <tr>
            <td style="padding:28px 48px 12px;text-align:center;">
              <a href="${dashboardUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#3a4e1e,#5a7030);color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;letter-spacing:0.3px;padding:18px 48px;border-radius:12px;box-shadow:0 8px 24px rgba(58,78,30,0.4);">
                View &amp; Respond in Dashboard &rarr;
              </a>
            </td>
          </tr>

          <!-- ── URGENCY NOTICE ── -->
          <tr>
            <td style="padding:8px 48px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border:1px solid #ffe082;border-left:4px solid #f4b400;border-radius:10px;">
                <tr>
                  <td style="padding:14px 18px;font-size:13px;color:#7a5c10;line-height:1.65;">
                    ⏰ &nbsp;<strong style="color:#5a400a;">Respond within 24 hours</strong> to maintain a high response rate on your Shubharambh profile and rank higher in search results.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#f5f1e8;border-top:1px solid #e0d8c8;padding:24px 48px;text-align:center;">
              <p style="margin:0 0 6px;font-size:16px;font-weight:800;color:#4a5c28;">✨ Shubharambh</p>
              <p style="margin:0;font-size:12px;color:#a09070;line-height:1.8;">
                This is an automated notification — please do not reply to this email.<br>
                Log into your vendor dashboard to respond to this enquiry.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── Appointment Email ─────────────────────────────────────────────────────────
export function appointmentRequestEmail({
  vendorName,
  businessName,
  userName,
  userEmail,
  appointmentType,
  scheduledDate,
  scheduledTime,
  eventType,
  attendees,
  notes,
  venueName,
  dashboardUrl,
}: {
  vendorName: string;
  businessName: string;
  userName: string;
  userEmail: string;
  appointmentType: string;
  scheduledDate: string;
  scheduledTime: string;
  eventType: string;
  attendees: number;
  notes?: string;
  venueName?: string;
  dashboardUrl: string;
}) {
  const typeLabel = appointmentType === 'visit' ? 'Site Visit' : 'Appointment';
  const typeIcon  = appointmentType === 'visit' ? '🏛️' : '📅';

  const formattedEvent = formatSlug(eventType);
  const showAttendees = attendees && attendees > 0;

  const apptRows = [
    { label: `${typeIcon} Type`,      value: typeLabel },
    { label: '🗓️ Date',               value: scheduledDate },
    { label: '⏰ Time',               value: scheduledTime },
    { label: '🎊 Event',              value: formattedEvent },
    ...(showAttendees ? [{ label: '👥 Guests', value: `${attendees} people` }] : []),
    ...(venueName ? [{ label: '🏛️ Venue', value: venueName }] : []),
    ...(notes ? [{ label: '📝 Notes', value: notes }] : []),
  ];

  const detailRows = apptRows
    .map(
      (r) => `
      <tr>
        <td style="padding:12px 24px;border-bottom:1px solid #f0ece3;width:40%;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#8a7a65;font-weight:600;white-space:nowrap;vertical-align:top;">
          ${r.label}
        </td>
        <td style="padding:12px 24px;border-bottom:1px solid #f0ece3;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#1e2a0e;font-weight:700;vertical-align:top;">
          ${r.value}
        </td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New ${typeLabel} Request – Shubharambh</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ece5;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ece5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 48px rgba(60,45,10,0.13);">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#2d3d14 0%,#4a5c28 50%,#6b7c41 100%);padding:44px 48px 36px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:100px;color:rgba(255,255,255,0.9);font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;padding:6px 18px;margin-bottom:20px;">
                ${typeIcon} New ${typeLabel}
              </div>
              <h1 style="margin:0 0 6px;color:#fff;font-size:32px;font-weight:800;letter-spacing:-0.5px;">
                ✨ Shubharambh
              </h1>
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;">
                Your trusted wedding &amp; event planning platform
              </p>
            </td>
          </tr>

          <!-- ── GOLD LINE ── -->
          <tr>
            <td style="height:5px;background:linear-gradient(to right,#c9a84c,#e8d060,#c9a84c);"></td>
          </tr>

          <!-- ── ALERT BANNER ── -->
          <tr>
            <td style="background:#fffbee;border-bottom:1px solid #f0d878;padding:16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:32px;font-size:22px;vertical-align:middle;">${typeIcon}</td>
                  <td style="padding-left:12px;font-size:14px;color:#7a5a08;line-height:1.6;">
                    <strong style="color:#5a4006;">New ${typeLabel} Request!</strong>
                    &nbsp;<strong>${userName}</strong> wants to ${appointmentType === 'visit' ? 'visit' : 'meet with'} you
                    at <strong>${venueName || businessName}</strong>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="padding:36px 48px 8px;">
              <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#1e2a0e;">
                Hello, ${vendorName}! 👋
              </p>
              <p style="margin:0;font-size:15px;color:#6b5e4a;line-height:1.75;">
                <strong style="color:#2c3a16;">${userName}</strong> has submitted a new
                <strong>${typeLabel.toLowerCase()} request</strong> for
                ${venueName ? `<strong>${venueName}</strong> at ` : ''}<strong>${businessName}</strong>.
                Please confirm or reschedule via your dashboard.
              </p>
            </td>
          </tr>

          <!-- ── CUSTOMER CARD ── -->
          <tr>
            <td style="padding:20px 48px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #e0d8c8;border-radius:14px;overflow:hidden;">
                <tr>
                  <td colspan="2" style="background:linear-gradient(135deg,#f5f1e8,#ede6d6);padding:13px 24px;border-bottom:1px solid #e0d8c8;">
                    <span style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a6b35;">👤 &nbsp;Customer</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 24px;border-bottom:1px solid #f0ece3;font-size:13px;color:#8a7a65;font-weight:600;width:40%;">Name</td>
                  <td style="padding:12px 24px;border-bottom:1px solid #f0ece3;font-size:15px;color:#1e2a0e;font-weight:800;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding:12px 24px;font-size:13px;color:#8a7a65;font-weight:600;">Email</td>
                  <td style="padding:12px 24px;font-size:14px;color:#4a5c28;font-weight:700;">
                    <a href="mailto:${userEmail}" style="color:#4a5c28;text-decoration:none;">${userEmail}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── APPOINTMENT DETAILS CARD ── -->
          <tr>
            <td style="padding:12px 48px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #e0d8c8;border-radius:14px;overflow:hidden;">
                <tr>
                  <td colspan="2" style="background:linear-gradient(135deg,#f5f1e8,#ede6d6);padding:13px 24px;border-bottom:1px solid #e0d8c8;">
                    <span style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a6b35;">${typeIcon} &nbsp;${typeLabel} Details</span>
                  </td>
                </tr>
                ${detailRows}
              </table>
            </td>
          </tr>

          <!-- ── CTA BUTTON ── -->
          <tr>
            <td style="padding:28px 48px 12px;text-align:center;">
              <a href="${dashboardUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#3a4e1e,#5a7030);color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;letter-spacing:0.3px;padding:18px 48px;border-radius:12px;box-shadow:0 8px 24px rgba(58,78,30,0.4);">
                Manage in Dashboard &rarr;
              </a>
            </td>
          </tr>

          <!-- ── URGENCY NOTICE ── -->
          <tr>
            <td style="padding:8px 48px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border:1px solid #ffe082;border-left:4px solid #f4b400;border-radius:10px;">
                <tr>
                  <td style="padding:14px 18px;font-size:13px;color:#7a5c10;line-height:1.65;">
                    ⏰ &nbsp;<strong style="color:#5a400a;">Confirm within 24 hours.</strong>
                    Timely confirmations lead to higher booking rates and better reviews on your profile.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#f5f1e8;border-top:1px solid #e0d8c8;padding:24px 48px;text-align:center;">
              <p style="margin:0 0 6px;font-size:16px;font-weight:800;color:#4a5c28;">✨ Shubharambh</p>
              <p style="margin:0;font-size:12px;color:#a09070;line-height:1.8;">
                This is an automated notification — please do not reply to this email.<br>
                Log into your vendor dashboard to confirm or reschedule this ${typeLabel.toLowerCase()}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}
