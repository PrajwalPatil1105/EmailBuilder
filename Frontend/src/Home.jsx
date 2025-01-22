import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Save,
  Download,
  Image,
  Type,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader,
  Plus,
  Link as LinkIcon,
} from "lucide-react";
import styles from "./Home.module.css";

const API_BASE_URL = "https://emailbuilder-hha7.onrender.com/api";

const EmailBuilder = () => {
  const [template, setTemplate] = useState({
    title: "",
    content: "",
    footer: "",
    imageUrl: "",
    buttonText: "",
    buttonUrl: "",
  });
  const [showButtonSection, setShowButtonSection] = useState(false);
  const [showImageSection, setShowImageSection] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getEmailLayout`);
      if (!response.ok) throw new Error("Failed to fetch template");
      const data = await response.text();
      setPreview(data);
    } catch (err) {
      setError("Failed to load template: " + err.message);
    }
  };

  const handleImageUrlSubmit = (e) => {
    e.preventDefault();
    clearMessages();

    if (!imageUrlInput) {
      setError("Please enter an image URL");
      return;
    }
    try {
      new URL(imageUrlInput);
      setTemplate((prev) => ({ ...prev, imageUrl: imageUrlInput }));
      setSuccess("Image URL added successfully!");
      setImageUrlInput("");
    } catch (err) {
      setError("Please enter a valid URL");
    }
  };

  const handleSave = async () => {
    clearMessages();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/uploadEmailConfig`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });

      if (!response.ok) throw new Error("Save failed");
      const data = await response.json();
      setSuccess(data.message);
    } catch (err) {
      setError("Failed to save template Please add Heading, Content, Footer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    clearMessages();
    setIsLoading(true);

    if (!template.title || !template.content || !template.footer) {
      setError("Title, content, and footer are required");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/renderAndDownloadTemplate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...template,
            buttonText: showButtonSection ? template.buttonText : "",
            buttonUrl: showButtonSection ? template.buttonUrl : "",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "email-template.html";

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess("Template downloaded successfully!");
    } catch (err) {
      setError(err.message || "Failed to download template");
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplate = (field, value) => {
    clearMessages();
    setTemplate((prev) => ({ ...prev, [field]: value }));
  };

  const handleRemoveButton = () => {
    setTemplate((prev) => ({
      ...prev,
      buttonText: "",
      buttonUrl: "",
    }));
    setShowButtonSection(false);
  };

  return (
    <motion.div className={styles.container}>
      <div className={styles.builderCard}>
        <motion.div className={styles.header}>
          <div className={styles.headerContent}>
            <Mail className={styles.headerIcon} />
            <h1>Email Template Builder</h1>
          </div>
        </motion.div>

        <div className={styles.content}>
          <div className={styles.editorSection}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <Type className={styles.inputIcon} />
                <span className={styles.labelText}>Title</span>
                <input
                  type="text"
                  value={template.title}
                  onChange={(e) => updateTemplate("title", e.target.value)}
                  placeholder="Enter email title..."
                  className={styles.input}
                />
              </label>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <FileText className={styles.inputIcon} />
                <span className={styles.labelText}>Content</span>
                <textarea
                  value={template.content}
                  onChange={(e) => updateTemplate("content", e.target.value)}
                  placeholder="Enter email content..."
                  className={styles.textarea}
                />
              </label>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <Type className={styles.inputIcon} />
                <span className={styles.labelText}>Footer</span>
                <input
                  type="text"
                  value={template.footer}
                  onChange={(e) => updateTemplate("footer", e.target.value)}
                  placeholder="Enter footer text..."
                  className={styles.input}
                />
              </label>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <Image className={styles.inputIcon} />
                <span className={styles.labelText}>Image URL</span>
                <div className={styles.imageUrlInput}>
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Enter image URL..."
                    className={styles.input}
                  />
                  <button
                    onClick={handleImageUrlSubmit}
                    className={styles.addUrlButton}
                    disabled={isLoading}
                  >
                    <LinkIcon className={styles.buttonIcon} />
                    Add Image
                  </button>
                </div>
              </label>
              {template.imageUrl && (
                <div className={styles.imagePreview}>
                  <img src={template.imageUrl} alt="Preview" />
                  <button
                    onClick={() => updateTemplate("imageUrl", "")}
                    className={styles.removeImageButton}
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>

            <motion.button
              onClick={() => setShowButtonSection(!showButtonSection)}
              className={styles.addSectionButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className={styles.buttonIcon} />
              {showButtonSection
                ? "Remove Button Section"
                : "Add Button Section"}
            </motion.button>

            {showButtonSection && (
              <>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    <LinkIcon className={styles.inputIcon} />
                    <span className={styles.labelText}>Button Text</span>
                    <input
                      type="text"
                      value={template.buttonText}
                      onChange={(e) =>
                        updateTemplate("buttonText", e.target.value)
                      }
                      placeholder="Enter button text..."
                      className={styles.input}
                    />
                  </label>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    <LinkIcon className={styles.inputIcon} />
                    <span className={styles.labelText}>Button URL</span>
                    <input
                      type="url"
                      value={template.buttonUrl}
                      onChange={(e) =>
                        updateTemplate("buttonUrl", e.target.value)
                      }
                      placeholder="Enter button URL..."
                      className={styles.input}
                    />
                  </label>
                </div>

                {(template.buttonText || template.buttonUrl) && (
                  <button
                    onClick={handleRemoveButton}
                    className={styles.removeButton}
                  >
                    Remove Button
                  </button>
                )}
              </>
            )}

            <div className={styles.buttonGroup}>
              <motion.button
                onClick={handleSave}
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={styles.saveButton}
              >
                <Save className={styles.buttonIcon} />
                Save Template
              </motion.button>
              <motion.button
                onClick={handleDownload}
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={styles.downloadButton}
              >
                <Download className={styles.buttonIcon} />
                Download
              </motion.button>
            </div>
          </div>

          <div className={styles.previewSection}>
            <h3>Live Preview</h3>
            <div className={styles.preview}>
              {preview && (
                <div
                  dangerouslySetInnerHTML={{
                    __html: preview
                      .replace(/{{title}}/g, template.title || "Your Title")
                      .replace(
                        /{{content}}/g,
                        template.content ||
                          "<span data-template-variable>Your Content</span>"
                      )
                      .replace(/{{footer}}/g, template.footer || "Your Footer")
                      .replace(
                        /{{imageUrl}}/g,
                        template.imageUrl || "Your Image"
                      )
                      .replace(
                        /{{buttonText}}/g,
                        template.buttonText || "Button Text"
                      )
                      .replace(/{{buttonUrl}}/g, template.buttonUrl || "#"),
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            className={styles.error}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            className={styles.success}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircle />
            {success}
          </motion.div>
        )}

        {isLoading && (
          <div className={styles.loader}>
            <Loader className={styles.spinningIcon} />
            Processing...
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EmailBuilder;
