"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import Footer from "../components/footer";
import PortalLayout from "../components/portal-layout";
import "../components/portal-layout.css";
import "./doc.css";

type UserProfile = {
  id?: number;
  name?: string;
  slug?: string;
  email?: string;
};

type UploadedDocs = {
  document_1: string;
  document_2: string;
};

export default function DocumentCenterPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [doc1, setDoc1] = useState<File | null>(null);
  const [doc2, setDoc2] = useState<File | null>(null);
  const [status, setStatus] = useState("not_uploaded");
  const [adminNote, setAdminNote] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocs>({
    document_1: "",
    document_2: "",
  });

  const doc1InputRef = useRef<HTMLInputElement | null>(null);
  const doc2InputRef = useRef<HTMLInputElement | null>(null);

  // USER FETCH
  useEffect(() => {
    const token = localStorage.getItem("wp_user_token");
    const savedUser = localStorage.getItem("wp_user_data");

    if (!token) {
      router.push("/login");
      return;
    }

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.email) {
          setUser(parsed);
        }
      } catch (error) {
        console.error("wp_user_data parse error:", error);
      }
    }

    fetch(`${process.env.NEXT_PUBLIC_WP_API}/wp-json/wp/v2/users/me?context=edit`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        const finalUser = {
          ...data,
          email: data?.email || "",
        };
        setUser(finalUser);
        localStorage.setItem("wp_user_data", JSON.stringify(finalUser));
      })
      .catch(() => {
        localStorage.removeItem("wp_user_token");
        localStorage.removeItem("wp_user_data");
        router.push("/login");
      })
      .finally(() => {
        setLoadingUser(false);
      });
  }, [router]);

  // LOAD STORED VALUES FIRST
  useEffect(() => {
    const storedStatus = localStorage.getItem("verificationStatus");
    const storedDocument1 = localStorage.getItem("document1Url");
    const storedDocument2 = localStorage.getItem("document2Url");
    const storedAdminNote = localStorage.getItem("verificationAdminNote");

    if (storedStatus) {
      setStatus(storedStatus);
    }

    if (storedAdminNote) {
      setAdminNote(storedAdminNote);
    }

    setUploadedDocs({
      document_1: storedDocument1 || "",
      document_2: storedDocument2 || "",
    });
  }, []);

  // FETCH LATEST STATUS FROM API
  useEffect(() => {
    if (!user?.email) return;

    fetch(`/api/get-verification-status?user_email=${encodeURIComponent(user.email)}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        const latestStatus = data?.status || "not_uploaded";
        const latestAdminNote = data?.admin_note || "";
        const latestDocument1 =
          data?.document_1 || data?.documents?.document_1 || "";
        const latestDocument2 =
          data?.document_2 || data?.documents?.document_2 || "";

        setStatus(latestStatus);
        setAdminNote(latestAdminNote);
        setUploadedDocs({
          document_1: latestDocument1,
          document_2: latestDocument2,
        });

        localStorage.setItem("verificationStatus", latestStatus);
        localStorage.setItem("document1Url", latestDocument1);
        localStorage.setItem("document2Url", latestDocument2);
        localStorage.setItem("verificationAdminNote", latestAdminNote);
      })
      .catch((error) => {
        console.error("Verification status fetch error:", error);
      });
  }, [user?.email]);

  // UPLOAD FUNCTION
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      setMessage("User not logged in. Please login again.");
      return;
    }

    const token = localStorage.getItem("wp_user_token");

    if (!token) {
      setMessage("Authentication token not found. Please login again.");
      router.push("/login");
      return;
    }

    if (!doc1 || !doc2) {
      setMessage("Please upload both PDF documents.");
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    if (doc1.size > MAX_FILE_SIZE || doc2.size > MAX_FILE_SIZE) {
      setMessage("Files must be less than 5MB.");
      return;
    }

    if (doc1.type !== "application/pdf" || doc2.type !== "application/pdf") {
      setMessage("Only PDF files are allowed.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("user_email", user.email);
      formData.append("document_1", doc1);
      formData.append("document_2", doc2);

      const res = await fetch("/api/upload-documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const newStatus = data.status || "pending";
        const newDocument1 = data?.documents?.document_1 || "";
        const newDocument2 = data?.documents?.document_2 || "";

        localStorage.setItem("verificationStatus", newStatus);
        localStorage.setItem("document1Url", newDocument1);
        localStorage.setItem("document2Url", newDocument2);
        localStorage.setItem("verificationAdminNote", "");

        setMessage(data.message || "Documents uploaded successfully.");
        setStatus(newStatus);
        setUploadedDocs({
          document_1: newDocument1,
          document_2: newDocument2,
        });
        setAdminNote("");
        setDoc1(null);
        setDoc2(null);

        if (doc1InputRef.current) doc1InputRef.current.value = "";
        if (doc2InputRef.current) doc2InputRef.current.value = "";
      } else {
        setMessage(data.message || "Upload failed.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Something went wrong during upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleReupload1 = () => {
    doc1InputRef.current?.click();
  };

  const handleReupload2 = () => {
    doc2InputRef.current?.click();
  };

  if (loadingUser) {
    return <div className="doc-loading">Loading...</div>;
  }

  return (
    <main>
      <Header portalMode />
      <PortalLayout
        user={user}
        title="Document Center"
        subtitle="Upload your PDF documents for verification"
      >
        <div className="doc-container">
          <div className="doc-status-row">
            <h2>Document Verification</h2>
            <span className={`doc-status-badge status-${status}`}>
              {(status === "verified" || status === "approved") && "Verified"}
              {status === "pending" && "Pending Approval"}
              {(status === "rejected" || status === "failed") && "Rejected"}
              {status === "not_uploaded" && "Not Uploaded"}
              {status === "loading" && "Loading"}
            </span>
          </div>

          <form onSubmit={handleUpload} className="doc-form">
            <div className="doc-flex">
              <div className="doc-box">
                <p>Upload Document 1 (PDF only)</p>
                <input
                  ref={doc1InputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setDoc1(e.target.files?.[0] || null)}
                  required={!uploadedDocs.document_1}
                />
                {doc1 && <span className="doc-file-name">{doc1.name}</span>}

                {uploadedDocs.document_1 && (
                  <div className="uploaded-doc-card">
                    {/* <a
                      href={uploadedDocs.document_1}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Uploaded Document 1
                    </a> */}
                    <button type="button" onClick={handleReupload1}>
                      Re-upload
                    </button>
                  </div>
                )}
              </div>

              <div className="doc-box">
                <p>Upload Document 2 (PDF only)</p>
                <input
                  ref={doc2InputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setDoc2(e.target.files?.[0] || null)}
                  required={!uploadedDocs.document_2}
                />
                {doc2 && <span className="doc-file-name">{doc2.name}</span>}

                {uploadedDocs.document_2 && (
                  <div className="uploaded-doc-card">
                    {/* <a
                      href={uploadedDocs.document_2}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Uploaded Document 2
                    </a> */}
                    <button type="button" onClick={handleReupload2}>
                      Re-upload
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={uploading || !user?.email}>
              {uploading ? "Uploading..." : "Upload Documents"}
            </button>
          </form>

          {message && <p className="doc-message">{message}</p>}

          {status === "pending" && (
            <p className="doc-message">
              Your documents have been uploaded and are waiting for admin approval.
            </p>
          )}

          {(status === "rejected" || status === "failed") && adminNote && (
            <p className="doc-message">Admin Note: {adminNote}</p>
          )}
        </div>
      </PortalLayout>
      <Footer />
    </main>
  );
}
