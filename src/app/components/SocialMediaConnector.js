import React, { useState } from "react";
import {
  FaInstagram,
  FaTwitter,
  FaFacebook,
  FaLink,
  FaExclamationCircle,
} from "react-icons/fa";
import {
  updateOrganizationSocialMedia,
  connectInstagramAccount,
  disconnectSocialMedia,
} from "../api/organizationsApi";
import { useContextAuth } from "../context/authContext";
import { toast } from "react-hot-toast";

const SocialMediaConnector = ({ organization, onUpdate }) => {
  const [socialMediaData, setSocialMediaData] = useState({
    instagramHandle: organization?.instagramHandle || "",
    instagramUrl: organization?.instagramUrl || "",
    twitterHandle: organization?.twitterHandle || "",
    twitterUrl: organization?.twitterUrl || "",
    facebookUrl: organization?.facebookUrl || "",
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const { getAuthHeader } = useContextAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSocialMediaData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsConnecting(true);
      const headers = await getAuthHeader();

      await updateOrganizationSocialMedia({
        id: organization.id,
        socialMediaData,
        headers,
      });

      if (onUpdate) {
        onUpdate({
          ...organization,
          ...socialMediaData,
        });
      }

      toast.success("Social media accounts updated");
    } catch (error) {
      toast.error(error.message || "Failed to update social media accounts");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectInstagram = async () => {
    try {
      setIsConnecting(true);

      // This would be a simplified version. In reality, you'd need to:
      // 1. Redirect to Instagram auth page
      // 2. Handle the callback with the auth code
      // 3. Exchange the code for a token in your backend

      // For this demo, we'll just simulate the process
      const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?client_id=${
        process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID
      }&redirect_uri=${encodeURIComponent(
        window.location.origin + "/api/instagram-callback"
      )}&scope=user_profile,user_media&response_type=code`;

      // Normally you'd redirect the user to this URL, but for now just show a toast
      toast.success("Redirecting to Instagram authorization page...");

      // Once you have the code from the callback:
      // const headers = await getAuthHeader();
      // await connectInstagramAccount({
      //   organizationId: organization.id,
      //   instagramCode: 'code-from-callback',
      //   headers
      // });
    } catch (error) {
      toast.error(error.message || "Failed to connect Instagram account");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (platform) => {
    try {
      setIsConnecting(true);
      const headers = await getAuthHeader();

      await disconnectSocialMedia({
        organizationId: organization.id,
        platform,
        headers,
      });

      // Reset the specific platform fields
      if (platform === "instagram") {
        setSocialMediaData((prev) => ({
          ...prev,
          instagramHandle: "",
          instagramUrl: "",
        }));
      } else if (platform === "twitter") {
        setSocialMediaData((prev) => ({
          ...prev,
          twitterHandle: "",
          twitterUrl: "",
        }));
      } else if (platform === "facebook") {
        setSocialMediaData((prev) => ({
          ...prev,
          facebookUrl: "",
        }));
      }

      if (onUpdate) {
        onUpdate({
          ...organization,
          ...socialMediaData,
        });
      }

      toast.success(`Disconnected ${platform} account`);
    } catch (error) {
      toast.error(error.message || `Failed to disconnect ${platform} account`);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Social Media Accounts</h2>
      <p className="text-gray-600 mb-6">
        Connect your business unit&apos;s social media accounts to automatically
        display posts in the social media feed.
      </p>

      <div className="space-y-6">
        {/* Instagram */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center mb-4">
            <FaInstagram className="text-pink-500 text-2xl mr-3" />
            <h3 className="font-medium">Instagram</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram Handle
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    @
                  </span>
                  <input
                    type="text"
                    name="instagramHandle"
                    value={socialMediaData.instagramHandle}
                    onChange={handleChange}
                    className="pl-7 w-full border border-gray-300 rounded-lg p-2"
                    placeholder="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram URL
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <FaLink />
                  </span>
                  <input
                    type="text"
                    name="instagramUrl"
                    value={socialMediaData.instagramUrl}
                    onChange={handleChange}
                    className="pl-8 w-full border border-gray-300 rounded-lg p-2"
                    placeholder="https://instagram.com/yourusername"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={handleConnectInstagram}
                disabled={isConnecting}
                className="bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded-lg flex items-center"
              >
                <FaInstagram className="mr-2" />
                Connect Instagram
              </button>

              {socialMediaData.instagramHandle && (
                <button
                  onClick={() => handleDisconnect("instagram")}
                  disabled={isConnecting}
                  className="text-red-500 hover:text-red-600"
                >
                  Disconnect
                </button>
              )}
            </div>

            <div className="text-xs text-gray-500 flex items-center mt-2">
              <FaExclamationCircle className="mr-1" />
              <span>
                Note: Instagram API access requires a business/creator account
                and may be subject to approval.
              </span>
            </div>
          </div>
        </div>

        {/* Twitter */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center mb-4">
            <FaTwitter className="text-blue-400 text-2xl mr-3" />
            <h3 className="font-medium">Twitter</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter Handle
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    @
                  </span>
                  <input
                    type="text"
                    name="twitterHandle"
                    value={socialMediaData.twitterHandle}
                    onChange={handleChange}
                    className="pl-7 w-full border border-gray-300 rounded-lg p-2"
                    placeholder="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter URL
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <FaLink />
                  </span>
                  <input
                    type="text"
                    name="twitterUrl"
                    value={socialMediaData.twitterUrl}
                    onChange={handleChange}
                    className="pl-8 w-full border border-gray-300 rounded-lg p-2"
                    placeholder="https://twitter.com/yourusername"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Facebook */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center mb-4">
            <FaFacebook className="text-blue-600 text-2xl mr-3" />
            <h3 className="font-medium">Facebook</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facebook Page URL
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <FaLink />
                </span>
                <input
                  type="text"
                  name="facebookUrl"
                  value={socialMediaData.facebookUrl}
                  onChange={handleChange}
                  className="pl-8 w-full border border-gray-300 rounded-lg p-2"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isConnecting}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg"
        >
          Save Social Media Settings
        </button>
      </div>
    </div>
  );
};

export default SocialMediaConnector;
