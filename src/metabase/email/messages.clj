(ns metabase.email.messages
  "Convenience functions for sending templated email messages.  Each function here should represent a single email.
   NOTE: we want to keep this about email formatting, so don't put heavy logic here RE: building data for emails."
  (:require [hiccup.core :refer [html]]
            [metabase.email :as email]
            [metabase.models.setting :as setting]
            [metabase.pulse :as p :refer [render-pulse-section]]
            [metabase.util :as u]
            [metabase.util.quotation :as q]
            [stencil.core :as stencil]
            [stencil.loader :as loader]))

;; NOTE: uncomment this in development to disable template caching
;; (loader/set-cache (clojure.core.cache/ttl-cache-factory {} :ttl 0))

;;; ### Public Interface

(defn send-new-user-email
  "Format and Send an welcome email for newly created users."
  [invited invitor join-url]
  (let [data-quote (rand-nth q/quotations)
        company (or (setting/get :site-name)
                    "Unknown")
        message-body (->> {:invitedName (:first_name invited)
                           :invitorName (:first_name invitor)
                           :invitorEmail (:email invitor)
                           :company company
                           :joinUrl join-url
                           :quotation (:quote data-quote)
                           :quotationAuthor (:author data-quote)
                           :today (u/format-date "MMM'&nbsp;'dd,'&nbsp;'yyyy" (System/currentTimeMillis))}
                          (stencil/render-file "metabase/email/new_user_invite"))]
    (email/send-message
      :subject     (str "You're invited to join " company "'s Metabase")
      :recipients   [(:email invited)]
      :message-type :html
      :message      message-body)))

(defn send-password-reset-email
  "Format and Send an email informing the user how to reset their password."
  [email hostname password-reset-url]
  {:pre [(string? email)
         (u/is-email? email)
         (string? hostname)
         (string? password-reset-url)]}
  (let [message-body (->> {:hostname hostname
                           :passwordResetUrl password-reset-url}
                          (stencil/render-file "metabase/email/password_reset"))]
    (email/send-message
     :subject      "[Metabase] Password Reset Request"
     :recipients   [email]
     :message-type :html
     :message      message-body)))

;; HACK: temporary workaround to postal requiring a file as the attachment
(defn- write-byte-array-to-temp-file
  [img-bytes]
  (let [file (java.io.File/createTempFile "metabase_pulse_image_" ".png")
        fos (new java.io.FileOutputStream file)]
    (.deleteOnExit file)
    (.write fos img-bytes)
    (.close fos)
    file))

(defn render-pulse-email
  "Take a pulse object and list of results, returns an array of attachment objects for an email"
  [pulse results]
  (let [images (atom [])
        render-img (fn [bytes] (reset! images (conj @images bytes)) (str "cid:IMAGE_" (-> @images count dec)))
        body (apply vector :div (mapv (partial render-pulse-section render-img) results))
        data-quote (rand-nth q/quotations)
        message-body (->> {:pulse (html body)
                           :pulseName (:name pulse)
                           :sectionStype p/section-style
                           :colorGrey4 p/color-grey-4
                           :quotation (:quote data-quote)
                           :quotationAuthor (:author data-quote)}
                          (stencil/render-file "metabase/email/pulse"))]
    (apply vector {:type "text/html" :content message-body}
                  (map-indexed (fn [idx bytes] {:type :inline
                                                :content-id (str "IMAGE_" idx)
                                                :content-type "image/png"
                                                :content (write-byte-array-to-temp-file bytes)})
                               @images))))
