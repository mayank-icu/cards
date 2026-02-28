// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Copy } from 'lucide-react';
import './css/App.css';

const CreatedJar = () => {
  const { jarId, viewId } = useParams();
  const baseUrl = "https://wish-mailer.up.railway.app";
  const wishLink = `${baseUrl}/jar/${jarId}`;
  const viewLink = `${baseUrl}/view/${jarId}/${viewId}`;

  const [email, setEmail] = useState('');
  const [emailPopup, setEmailPopup] = useState(false);
  const [emailSentCount, setEmailSentCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedCount = localStorage.getItem(`emailSentCount_${jarId}`);
    if (storedCount) {
      setEmailSentCount(parseInt(storedCount));
    }
  }, [jarId]);

  const handleSendEmail = async () => {
    if (emailSentCount >= 2) {
      toast.error('Email sending limit reached.');
      return;
    }

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const emailTemplate = `
        <!DOCTYPE html>
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Your Wish Jar Links</title>
        </head>
        <body style="margin:0;padding:0;width:100%;background-color:#f3f4f6;">
          <center style="width:100%;background-color:#f3f4f6;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;background-color:#ffffff;border-radius:8px;margin:40px 0;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding:40px 30px;text-align:center;background-color:#66A8B8;border-radius:8px 8px 0 0;">
                  <h1 style="color:#ffffff;font-family:Arial,sans-serif;font-size:28px;margin:0;">Your Wish Jar Links</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:30px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="background-color:#f8fafc;padding:25px;border-radius:8px;">
                        <h2 style="color:#1f2937;font-family:Arial,sans-serif;font-size:20px;margin:0 0 15px 0;">Share Link for Friends</h2>
                        <p style="color:#4b5563;font-family:Arial,sans-serif;margin:0 0 15px 0;">Let your friends make wishes using this link:</p>
                        <div style="background-color:#ffffff;padding:15px;border-radius:6px;border:1px solid #e5e7eb;">
                          <a href="${wishLink}" style="color:#66A8B8;font-family:Arial,sans-serif;text-decoration:none;word-break:break-all;display:block;">${wishLink}</a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 30px 30px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="background-color:#f8fafc;padding:25px;border-radius:8px;">
                        <h2 style="color:#1f2937;font-family:Arial,sans-serif;font-size:20px;margin:0 0 15px 0;">View All Wishes</h2>
                        <p style="color:#4b5563;font-family:Arial,sans-serif;margin:0 0 15px 0;">Use this private link to view all wishes:</p>
                        <div style="background-color:#ffffff;padding:15px;border-radius:6px;border:1px solid #e5e7eb;">
                          <a href="${viewLink}" style="color:#66A8B8;font-family:Arial,sans-serif;text-decoration:none;word-break:break-all;display:block;">${viewLink}</a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:30px;background-color:#f8fafc;border-top:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
                  <p style="color:#6b7280;font-family:Arial,sans-serif;font-size:14px;margin:0;text-align:center;font-style:italic;">
                    Keep these links safe! The view link is private and should only be shared with people you trust.
                  </p>
                </td>
              </tr>
            </table>
          </center>
        </body>
        </html>
      `;

      const textTemplate = `Your Wish Jar Links\n\nShare Link: ${wishLink}\nView Link: ${viewLink}\n\nKeep these links safe!`;

      const response = await fetch('/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Your Wish Jar Links',
          text: textTemplate,
          html: emailTemplate
        }),
      });

      if (!response.ok) throw new Error('Email send failed');

      const newCount = emailSentCount + 1;
      setEmailSentCount(newCount);
      localStorage.setItem(`emailSentCount_${jarId}`, newCount.toString());

      setEmailPopup(false);
      setEmail('');
      toast.success('Email sent successfully!');
    } catch (err) {
      console.error('Error sending email:', err);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const styles = {
    button: {
      background: '#66A8B8',
      border: 'none',
      padding: '10px 20px',
      color: 'white',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '1rem',
      margin: '10px',
      minWidth: '100px',
      transition: 'background-color 0.3s ease',
      opacity: loading ? 0.7 : 1,
    },
    cancelButton: {
      background: '#B66A8B',
    },
    icon: {
      cursor: 'pointer',
      marginLeft: '10px',
      color: '#66A8B8',
    },
    popup: {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    popupContent: {
      background: 'white',
      padding: '30px',
      borderRadius: '10px',
      maxWidth: '400px',
      width: '90%',
      textAlign: 'center',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    input: {
      width: '100%',
      padding: '10px',
      marginBottom: '20px',
      borderRadius: '5px',
      border: '1px solid #ddd',
      fontSize: '1rem',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      gap: '10px',
    }
  };

  return (
    <div className="created-jar">
      <Toaster position="top-center" reverseOrder={false} />
      <h2 style={{ fontSize: "34px", textAlign: "center", marginBottom: "30px" }}>Your Wish Jar is Ready!</h2>
      <div className="links">
        <div>
          <h3>Share this link with friends to let them make wishes:</h3>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: "10px" }}>
            <input readOnly value={wishLink} onClick={(e) => e.currentTarget.select()} style={{ flex: 1 }} />
            <Copy style={styles.icon} onClick={() => handleCopyLink(wishLink)} />
          </div>
        </div>
        <div>
          <h3>Use this link to view all wishes:</h3>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: "10px" }}>
            <input readOnly value={viewLink} onClick={(e) => e.currentTarget.select()} style={{ flex: 1 }} />
            <Copy style={styles.icon} onClick={() => handleCopyLink(viewLink)} />
          </div>
        </div>
        {emailSentCount < 2 ? (
          <button
            style={styles.button}
            onClick={() => setEmailPopup(true)}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Email Me'}
          </button>
        ) : (
          <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>
            Email sending limit reached (2/2 emails sent)
          </p>
        )}
      </div>

      {emailPopup && (
        <div style={styles.popup}>
          <div style={styles.popupContent}>
            <h3 style={{ marginBottom: "20px", fontSize: "25px" }}>Enter your email address:</h3>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="youremail@gmail.com"
              disabled={loading}
              style={styles.input}
            />
            <div style={styles.buttonContainer}>
              <button
                style={styles.button}
                onClick={handleSendEmail}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
              <button
                style={{ ...styles.button, ...styles.cancelButton }}
                onClick={() => setEmailPopup(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatedJar;