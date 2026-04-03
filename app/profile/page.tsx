"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import Footer from "../components/footer";
import PortalLayout from "../components/portal-layout";
import "../components/portal-layout.css";
import "./profile.css";

type UserProfile = {
  id?: number;
  name?: string;
  slug?: string;
  email?: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [showPasswordBox, setShowPasswordBox] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("wp_user_token");

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_WP_API}/wp-json/wp/v2/users/me?context=edit`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then((data) => {
        const finalUser = {
          ...data,
          email: data?.email || "",
          name: data?.name || "",
        };

        setUser(finalUser);
        setName(finalUser.name || "");
        setEmail(finalUser.email || "");
        localStorage.setItem("wp_user_data", JSON.stringify(finalUser));
      })
      .catch(() => {
        localStorage.removeItem("wp_user_token");
        localStorage.removeItem("wp_user_data");
        router.push("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  const handleEditClick = () => {
    clearMessages();
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    clearMessages();
    setEditMode(false);
    setName(user?.name || "");
  };

  const handleProfileUpdate = async () => {
    try {
      clearMessages();

      const token = localStorage.getItem("wp_user_token");

      if (!token) {
        router.push("/login");
        return;
      }

      if (!name.trim()) {
        setError("Name is required.");
        return;
      }

      setSavingProfile(true);

      const res = await fetch("/api/profile/update-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to update profile.");
        return;
      }

      const updatedUser = {
        ...user,
        name: name.trim(),
      };

      setUser(updatedUser);
      setName(updatedUser.name || "");
      setEmail(updatedUser.email || "");
      localStorage.setItem("wp_user_data", JSON.stringify(updatedUser));

      setEditMode(false);
      setMessage(data.message || "Profile updated successfully.");
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Something went wrong while updating profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordToggle = () => {
    clearMessages();
    setShowPasswordBox((prev) => !prev);

    if (showPasswordBox) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handlePasswordChange = async () => {
    try {
      clearMessages();

      const token = localStorage.getItem("wp_user_token");

      if (!token) {
        router.push("/login");
        return;
      }

      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("Please fill all password fields.");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("New password and confirm password do not match.");
        return;
      }

      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters.");
        return;
      }

      setChangingPassword(true);

      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to change password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordBox(false);
      setMessage(data.message || "Password changed successfully.");
    } catch (err) {
      console.error("Password change error:", err);
      setError("Something went wrong while changing password.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return <div className="profilePage loadingText">Loading...</div>;
  }

  return (
    <main>
      <Header portalMode />

      <PortalLayout
        user={user}
        title="My Profile"
        subtitle={`Welcome ${user?.name || "User"}`}
      >
        <div className="profilePage">
          <div className="profileCard">
            <div className="profileTopRow">
              <div>
                <h2 className="profileTitle">Profile Details</h2>
                <p className="profileSubtext">
                  View and manage your account information.
                </p>
              </div>

              {!editMode ? (
                <button className="profileBtn primaryBtn" onClick={handleEditClick}>
                  Edit Profile
                </button>
              ) : (
                <div className="profileBtnGroup">
                  <button
                    className="profileBtn successBtn"
                    onClick={handleProfileUpdate}
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Saving..." : "Save"}
                  </button>

                  <button
                    className="profileBtn secondaryBtn"
                    onClick={handleCancelEdit}
                    disabled={savingProfile}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {message && <div className="successMessage">{message}</div>}
            {error && <div className="errorMessage">{error}</div>}

            <div className="profileForm">
              <div className="profileField">
                <label>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!editMode}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="profileField">
                <label>Email</label>
                <input type="email" value={email} disabled />
              </div>

            </div>

            <div className="passwordSection">
              <div className="profileTopRow">
                <div>
                  <h2 className="profileTitle">Change Password</h2>
                  <p className="profileSubtext">
                    Update your password to keep your account secure.
                  </p>
                </div>

                <button className="profileBtn warningBtn" onClick={handlePasswordToggle}>
                  {showPasswordBox ? "Close" : "Change Password"}
                </button>
              </div>

              {showPasswordBox && (
                <div className="passwordBox">
                  <div className="profileField">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="profileField">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="profileField">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button
                    className="profileBtn successBtn fullWidthBtn"
                    onClick={handlePasswordChange}
                    disabled={changingPassword}
                  >
                    {changingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </PortalLayout>

      <Footer />
    </main>
  );
}