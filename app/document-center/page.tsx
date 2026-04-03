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

  // Fetch user
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
        console.error("User parse error:", error);
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
      .finally(() => setLoadingUser(false));
  }, [router]);

  // Fetch verification status
  useEffect(() => {
    if (!user?.email) return;

    fetch(`/api/get-verification-status?user_email=${encodeURIComponent(user.email)}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        setStatus(data?.status || "not_uploaded");
        setUploadedDocs({
          document_1: data?.documents?.document_1 || "",
          document_2: data?.documents?.document_2 || "",
        });
        setAdminNote(data?.admin_note || "");
      })
      .catch((err) => {
        console.error("Status fetch error:", err);
      });
  }, [user?.email]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      setMessage("User not logged in.");
      return;
    }

    const token = localStorage.getItem("wp_user_token");

    if (!token) {
      setMessage("Please login again.");
      router.push("/login");
      return;
    }

    if (!doc1 || !doc2) {
      setMessage("Upload both documents.");
      return;
    }

    if (
      doc1.type !== "application/pdf" ||
      doc2.type !== "application/pdf"
    ) {
      setMessage("Only PDFs allowed.");
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
        setMessage(data.message);
        setStatus(data.status || "pending");
        setUploadedDocs({
          document_1: data?.documents?.document_1 || "",
          document_2: data?.documents?.document_2 || "",
        });
        setAdminNote("");

        localStorage.setItem("verificationStatus", data.status || "pending");

        if (doc1InputRef.current) doc1InputRef.current.value = "";
        if (doc2InputRef.current) doc2InputRef.current.value = "";
      } else {
        setMessage(data.message || "Upload failed.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Upload error.");
    } finally {
      setUploading(false);
    }
  };

  if (loadingUser) return <div>Loading...</div>;

  return (
    <main>
      <Header portalMode />
      <PortalLayout user={user} title="Document Center" subtitle="Upload your documents">
        <form onSubmit={handleUpload}>
          <input
            ref={doc1InputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => setDoc1(e.target.files?.[0] || null)}
          />

          <input
            ref={doc2InputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => setDoc2(e.target.files?.[0] || null)}
          />

          <button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>

        {message && <p>{message}</p>}
      </PortalLayout>
      <Footer />
    </main>
  );
}
