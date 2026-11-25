'use strict';
const settingsSearchEntries=[
 {
  "path": "IdleScreenEnabled",
  "label": "Bildschirmschoner verwenden",
  "page": "flow",
  "sub": "idle"
 },
 {
  "path": "IdleScreenSeconds",
  "label": "Erscheint nach",
  "page": "flow",
  "sub": "idle"
 },
 {
  "path": "IdleScreenMode",
  "label": "Inhalt",
  "page": "flow",
  "sub": "idle"
 },
 {
  "path": "ShowGallery",
  "label": "Galerie",
  "page": "flow",
  "sub": "start"
 },
 {
  "path": "StartTrigger",
  "label": "Start durch",
  "page": "flow",
  "sub": "start"
 },
 {
  "path": "StartTapAction",
  "label": "Antippen startet",
  "page": "flow",
  "sub": "start"
 },
 {
  "path": "CountdownSeconds",
  "label": "Einzelfoto",
  "page": "flow",
  "sub": "capture"
 },
 {
  "path": "CollageCountdown",
  "label": "Je Collagebild",
  "page": "flow",
  "sub": "capture"
 },
 {
  "path": "CollagePauseSeconds",
  "label": "Pause dazwischen",
  "page": "flow",
  "sub": "capture"
 },
 {
  "path": "CollageConfirmNext",
  "label": "Jedes Collagebild bestätigen",
  "page": "flow",
  "sub": "capture"
 },
 {
  "path": "ShowCancel",
  "label": "Abbrechen erlauben",
  "page": "flow",
  "sub": "capture"
 },
 {
  "path": "Mirror",
  "label": "Livebild spiegeln",
  "page": "flow",
  "sub": "capture"
 },
 {
  "path": "ShutterDurationMs",
  "label": "Blitzeffekt",
  "page": "flow",
  "sub": "capture"
 },
 {
  "path": "ProcessingDelayMs",
  "label": "Verarbeitung mind.",
  "page": "flow",
  "sub": "capture"
 },
 {
  "path": "ResultAutoShare",
  "label": "QR-Code automatisch öffnen",
  "page": "flow",
  "sub": "result"
 },
 {
  "path": "FiltersEnabled",
  "label": "Filter anbieten",
  "page": "flow",
  "sub": "result"
 },
 {
  "path": "ResultAutoFilters",
  "label": "Filterauswahl automatisch öffnen",
  "page": "flow",
  "sub": "result"
 },
 {
  "path": "ShowRetake",
  "label": "Neue Aufnahme anbieten",
  "page": "flow",
  "sub": "result"
 },
 {
  "path": "ShowDelete",
  "label": "Löschen erlauben",
  "page": "flow",
  "sub": "result"
 },
 {
  "path": "BackgroundColor",
  "label": "Hintergrund",
  "page": "design",
  "sub": "style"
 },
 {
  "path": "ForegroundColor",
  "label": "Text",
  "page": "design",
  "sub": "style"
 },
 {
  "path": "ButtonColor",
  "label": "Buttons",
  "page": "design",
  "sub": "style"
 },
 {
  "path": "Accent",
  "label": "Akzent",
  "page": "design",
  "sub": "style"
 },
 {
  "path": "FontName",
  "label": "Schriftart",
  "page": "design",
  "sub": "style"
 },
 {
  "path": "HeadingSize",
  "label": "Überschriften",
  "page": "design",
  "sub": "style"
 },
 {
  "path": "StartButtonWidth",
  "label": "Breite",
  "page": "design",
  "sub": "style"
 },
 {
  "path": "ButtonHeight",
  "label": "Höhe",
  "page": "design",
  "sub": "style"
 },
 {
  "path": "ButtonSize",
  "label": "Textgröße",
  "page": "design",
  "sub": "style"
 },
 {
  "path": "ButtonRadius",
  "label": "Rundung",
  "page": "design",
  "sub": "style"
 },
 {
  "path": "GlassButtons",
  "label": "Glaseffekt",
  "page": "design",
  "sub": "style"
 },
 {
  "path": "UiScale",
  "label": "Oberfläche skalieren",
  "page": "design",
  "sub": "style"
 },
 {
  "path": "UnifiedStartLabel",
  "label": "Buttontext",
  "page": "design",
  "sub": "home"
 },
 {
  "path": "StartBackgroundImage",
  "label": "Hintergrundbild",
  "page": "design",
  "sub": "home"
 },
 {
  "path": "StartBackgroundVideo",
  "label": "Video oder GIF",
  "page": "design",
  "sub": "home"
 },
 {
  "path": "StartLogo",
  "label": "Logo",
  "page": "design",
  "sub": "home"
 },
 {
  "path": "ShowWelcome",
  "label": "Überschrift",
  "page": "design",
  "sub": "home"
 },
 {
  "path": "Welcome",
  "label": "Überschrift",
  "page": "design",
  "sub": "home"
 },
 {
  "path": "Subtitle",
  "label": "Untertitel",
  "page": "design",
  "sub": "home"
 },
 {
  "path": "StartTapHint",
  "label": "Hinweis zum Antippen",
  "page": "design",
  "sub": "home"
 },
 {
  "path": "SingleLabel",
  "label": "Einzelfoto",
  "page": "design",
  "sub": "home"
 },
 {
  "path": "CollageLabel",
  "label": "Collage",
  "page": "design",
  "sub": "home"
 },
 {
  "path": "GalleryLabel",
  "label": "Galerie",
  "page": "design",
  "sub": "home"
 },
 {
  "path": "CapturePrompt",
  "label": "Text",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CapturePromptImage",
  "label": "Stattdessen ein Bild",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CountdownScale",
  "label": "Größe",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CountdownColor",
  "label": "Farbe",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CountdownFontName",
  "label": "Schrift",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CountdownAnimation",
  "label": "Zahlen animieren",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CountdownRing",
  "label": "Ablaufender Kreis",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CountdownRingWidth",
  "label": "Kreisstärke",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CountdownRingColor",
  "label": "Kreisfarbe",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CaptureProcessingText",
  "label": "Text Einzelfoto",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CollageProcessingText",
  "label": "Text Collage",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "ProcessingColor",
  "label": "Text und Symbol",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "ProcessingBackground",
  "label": "Hintergrund",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CollageThumbWidth",
  "label": "Vorschaubilder",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CaptureReviewScale",
  "label": "Bild bei Bestätigung",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CaptureCancelLabel",
  "label": "Beschriftung",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CaptureCancelColor",
  "label": "Text",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CaptureCancelBackground",
  "label": "Hintergrund",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CaptureCancelWidth",
  "label": "Breite",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "CaptureCancelHeight",
  "label": "Höhe",
  "page": "design",
  "sub": "capture"
 },
 {
  "path": "DeleteDialogScale",
  "label": "Fenstergröße",
  "page": "design",
  "sub": "result"
 },
 {
  "path": "ResultScale",
  "label": "Größe",
  "page": "design",
  "sub": "result"
 },
 {
  "path": "ResultPhotoX",
  "label": "Horizontal",
  "page": "design",
  "sub": "result"
 },
 {
  "path": "ResultPhotoY",
  "label": "Vertikal",
  "page": "design",
  "sub": "result"
 },
 {
  "path": "ResultTitle",
  "label": "Bildbeschreibung",
  "page": "design",
  "sub": "result"
 },
 {
  "path": "ResultBlur",
  "label": "Foto unscharf dahinter",
  "page": "design",
  "sub": "result"
 },
 {
  "path": "ResultBlurStrength",
  "label": "Unschärfe",
  "page": "design",
  "sub": "result"
 },
 {
  "path": "ResultBackdropScale",
  "label": "Vergrößern",
  "page": "design",
  "sub": "result"
 },
 {
  "path": "HomeLabel",
  "label": "Startseite",
  "page": "design",
  "sub": "result"
 },
 {
  "path": "DownloadLabel",
  "label": "Download",
  "page": "design",
  "sub": "result"
 },
 {
  "path": "NewPhotoLabel",
  "label": "Neues Foto",
  "page": "design",
  "sub": "result"
 },
 {
  "path": "NewCollageLabel",
  "label": "Neue Collage",
  "page": "design",
  "sub": "result"
 },
 {
  "path": "DeleteLabel",
  "label": "Löschen",
  "page": "design",
  "sub": "result"
 },
 {
  "path": "ResultIconPosition",
  "label": "Symbolleiste",
  "page": "design",
  "sub": "result"
 },
 {
  "path": "GalleryTitle",
  "label": "Überschrift",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryTitleSize",
  "label": "Schriftgröße",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryTitleColor",
  "label": "Schriftfarbe",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryHeaderBackground",
  "label": "Hintergrund",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryHeaderHeight",
  "label": "Höhe",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryColumns",
  "label": "Spalten",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryAspect",
  "label": "Kartenformat",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryFit",
  "label": "Bild",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryGap",
  "label": "Abstand",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GallerySidePadding",
  "label": "Seitenrand",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryTopGap",
  "label": "Abstand oben",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryRadius",
  "label": "Ecken",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryShadow",
  "label": "Schatten",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryCardBackground",
  "label": "Kartenfarbe",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryShowDate",
  "label": "Anzeigen",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryOverlayCaption",
  "label": "Über dem Foto",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryCaptionSize",
  "label": "Schriftgröße",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryCaptionColor",
  "label": "Text",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryCaptionBackground",
  "label": "Hintergrund",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryHomeWidth",
  "label": "Breite",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryHomeHeight",
  "label": "Höhe",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryHomeFontSize",
  "label": "Schriftgröße",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryBackgroundImage",
  "label": "Hintergrundbild",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "GalleryFontName",
  "label": "Schrift",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "ViewerBackground",
  "label": "Hintergrund",
  "page": "design",
  "sub": "viewer"
 },
 {
  "path": "ViewerTextColor",
  "label": "Text",
  "page": "design",
  "sub": "viewer"
 },
 {
  "path": "ViewerScale",
  "label": "Bildgröße",
  "page": "design",
  "sub": "viewer"
 },
 {
  "path": "ViewerPadding",
  "label": "Randabstand",
  "page": "design",
  "sub": "viewer"
 },
 {
  "path": "ViewerShowName",
  "label": "Dateiname",
  "page": "design",
  "sub": "viewer"
 },
 {
  "path": "ViewerShowDate",
  "label": "Datum und Uhrzeit",
  "page": "design",
  "sub": "viewer"
 },
 {
  "path": "ViewerNameSize",
  "label": "Schriftgröße Name",
  "page": "design",
  "sub": "viewer"
 },
 {
  "path": "ViewerNamePosition",
  "label": "Position Name",
  "page": "design",
  "sub": "viewer"
 },
 {
  "path": "ViewerShowCounter",
  "label": "Zähler „3 / 24“",
  "page": "design",
  "sub": "viewer"
 },
 {
  "path": "ViewerCounterSize",
  "label": "Schriftgröße Zähler",
  "page": "design",
  "sub": "viewer"
 },
 {
  "path": "ViewerCounterPosition",
  "label": "Position Zähler",
  "page": "design",
  "sub": "viewer"
 },
 {
  "path": "ViewerActionOrientation",
  "label": "Richtung",
  "page": "design",
  "sub": "viewer"
 },
 {
  "path": "ViewerActionSize",
  "label": "Symbolgröße",
  "page": "design",
  "sub": "viewer"
 },
 {
  "path": "ViewerActionPosition",
  "label": "Position",
  "page": "design",
  "sub": "viewer"
 },
 {
  "path": "ViewerClosePosition",
  "label": "Schließen",
  "page": "design",
  "sub": "viewer"
 },
 {
  "path": "SelectionBackground",
  "label": "Hintergrund",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "SelectionForeground",
  "label": "Text",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "SelectionOpacity",
  "label": "Deckkraft",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "SelectionBlur",
  "label": "Unschärfe dahinter",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "SelectionButtonWidth",
  "label": "Buttonbreite",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "SelectionButtonHeight",
  "label": "Buttonhöhe",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "SelectionFontSize",
  "label": "Schriftgröße",
  "page": "design",
  "sub": "gallery"
 },
 {
  "path": "DownloadDialogScale",
  "label": "QR-Fenster",
  "page": "design",
  "sub": "download"
 },
 {
  "path": "DownloadBackground",
  "label": "Hintergrund",
  "page": "design",
  "sub": "download"
 },
 {
  "path": "DownloadForeground",
  "label": "Text",
  "page": "design",
  "sub": "download"
 },
 {
  "path": "DownloadOpacity",
  "label": "Deckkraft",
  "page": "design",
  "sub": "download"
 },
 {
  "path": "DownloadBlur",
  "label": "Unschärfe dahinter",
  "page": "design",
  "sub": "download"
 },
 {
  "path": "DownloadFontSize",
  "label": "Schriftgröße",
  "page": "design",
  "sub": "download"
 },
 {
  "path": "DownloadQrSize",
  "label": "QR-Code",
  "page": "design",
  "sub": "download"
 },
 {
  "path": "WifiStepTitle",
  "label": "Überschrift",
  "page": "design",
  "sub": "download"
 },
 {
  "path": "WifiInstructions",
  "label": "Hinweis",
  "page": "design",
  "sub": "download"
 },
 {
  "path": "ConnectedLabel",
  "label": "Button „Verbunden“",
  "page": "design",
  "sub": "download"
 },
 {
  "path": "DownloadStepTitle",
  "label": "Überschrift",
  "page": "design",
  "sub": "download"
 },
 {
  "path": "DownloadInstructions",
  "label": "Hinweis",
  "page": "design",
  "sub": "download"
 },
 {
  "path": "ShowDownloadAlternative",
  "label": "Adresse und Code zusätzlich zeigen",
  "page": "design",
  "sub": "download"
 },
 {
  "path": "IdleScreenEnabled",
  "label": "Bildschirmschoner verwenden",
  "page": "design",
  "sub": "idle"
 },
 {
  "path": "IdleShowText",
  "label": "Hinweis anzeigen",
  "page": "design",
  "sub": "idle"
 },
 {
  "path": "IdleScreenText",
  "label": "Hinweis",
  "page": "design",
  "sub": "idle"
 },
 {
  "path": "IdleSlideSeconds",
  "label": "Wechsel nach",
  "page": "design",
  "sub": "idle"
 },
 {
  "path": "IdlePhotoFit",
  "label": "Fotos",
  "page": "design",
  "sub": "idle"
 },
 {
  "path": "IdlePhotoScale",
  "label": "Bildgröße",
  "page": "design",
  "sub": "idle"
 },
 {
  "path": "IdleBackdrop",
  "label": "Hintergrund",
  "page": "design",
  "sub": "idle"
 },
 {
  "path": "IdleBackgroundColor",
  "label": "Hintergrundfarbe",
  "page": "design",
  "sub": "idle"
 },
 {
  "path": "IdleBackgroundImage",
  "label": "Hintergrundbild",
  "page": "design",
  "sub": "idle"
 },
 {
  "path": "DownloadMode",
  "label": "Zugang zum Foto",
  "page": "sharing",
  "sub": ""
 },
 {
  "path": "DownloadEnabled",
  "label": "Downloads erlauben",
  "page": "sharing",
  "sub": ""
 },
 {
  "path": "DownloadAddress",
  "label": "IPv4-Adresse der Box",
  "page": "sharing",
  "sub": ""
 },
 {
  "path": "DownloadPort",
  "label": "Port",
  "page": "sharing",
  "sub": ""
 },
 {
  "path": "LinkMinutes",
  "label": "Links gültig",
  "page": "sharing",
  "sub": ""
 },
 {
  "path": "WifiName",
  "label": "WLAN-Name (SSID)",
  "page": "sharing",
  "sub": ""
 },
 {
  "path": "WifiSecurity",
  "label": "Verschlüsselung",
  "page": "sharing",
  "sub": ""
 },
 {
  "path": "WindowsAutostart",
  "label": "Mit Windows starten",
  "page": "system",
  "sub": ""
 },
 {
  "path": "SaveUnframedOriginals",
  "label": "Originale zusätzlich ohne Rahmen speichern",
  "page": "system",
  "sub": ""
 },
 {
  "path": "HiddenAdminEntry",
  "label": "Verstecktes Admin-Feld",
  "page": "system",
  "sub": ""
 },
 {
  "path": "UsbAutoDetect",
  "label": "USB-Sticks automatisch erkennen",
  "page": "system",
  "sub": ""
 },
 {
  "path": "UsbRequireRemovable",
  "label": "Nur auf Wechseldatenträger",
  "page": "system",
  "sub": ""
 },
 {
  "path": "WelcomeScreenEnabled",
  "label": "Auftakt vor der Startseite",
  "page": "flow",
  "sub": "welcome"
 },
 {
  "path": "WelcomeScreenReturnOnHome",
  "label": "Nach einer Sitzung wieder zum Auftakt",
  "page": "flow",
  "sub": "welcome"
 },
 {
  "path": "WelcomeScreenEnabled",
  "label": "Auftakt verwenden",
  "page": "design",
  "sub": "welcome"
 },
 {
  "path": "WelcomeScreenText",
  "label": "Hinweistext",
  "page": "design",
  "sub": "welcome"
 },
 {
  "path": "WelcomeScreenImage",
  "label": "Hintergrundbild",
  "page": "design",
  "sub": "welcome"
 },
 {
  "path": "WelcomeScreenColor",
  "label": "Hintergrundfarbe",
  "page": "design",
  "sub": "welcome"
 },
 {
  "path": "WelcomeTextColor",
  "label": "Textfarbe",
  "page": "design",
  "sub": "welcome"
 },
 {
  "path": "WelcomeTextFont",
  "label": "Schrift",
  "page": "design",
  "sub": "welcome"
 },
 {
  "path": "WelcomeTextSize",
  "label": "Schriftgröße",
  "page": "design",
  "sub": "welcome"
 },
 {
  "path": "TemplatePickerBackground",
  "label": "Hintergrund",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "LayoutSelectionLive",
  "label": "Livebild im Hintergrund",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerShowNames",
  "label": "Vorlagennamen anzeigen",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerShowCounts",
  "label": "Ergebnisse pro Vorlage anzeigen",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "CustomTemplatePickerStyle",
  "label": "Eigene Kartengestaltung",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerScale",
  "label": "Gesamtskalierung",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerCardWidth",
  "label": "Kartenbreite",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerGap",
  "label": "Abstand",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerImageHeight",
  "label": "Vorschaubildhöhe",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerFontSize",
  "label": "Schriftgröße",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerTextColor",
  "label": "Text",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerCardColor",
  "label": "Kartenfarbe",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerCardOpacity",
  "label": "Deckkraft",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerBlur",
  "label": "Blur dahinter",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerRadius",
  "label": "Eckenrundung",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerBorderColor",
  "label": "Umrandung",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerBorderWidth",
  "label": "Randstärke",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerPadding",
  "label": "Innenabstand",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "TemplatePickerShadow",
  "label": "Schatten",
  "page": "design",
  "sub": "templates"
 },
 {
  "path": "MessageBackground",
  "label": "Hintergrund",
  "page": "design",
  "sub": "messages"
 },
 {
  "path": "MessageForeground",
  "label": "Text",
  "page": "design",
  "sub": "messages"
 },
 {
  "path": "MessageFontSize",
  "label": "Schriftgröße",
  "page": "design",
  "sub": "messages"
 },
 {
  "path": "DeleteDialogTitle",
  "label": "Titel",
  "page": "design",
  "sub": "messages"
 },
 {
  "path": "DeleteDialogText",
  "label": "Infotext",
  "page": "design",
  "sub": "messages"
 },
 {
  "path": "DeleteConfirmText",
  "label": "Entfernen-Button",
  "page": "design",
  "sub": "messages"
 },
 {
  "path": "DeleteCancelText",
  "label": "Behalten-Button",
  "page": "design",
  "sub": "messages"
 },
 {
  "label": "Vorlagen bestimmen · Zufällig oder feste Vorlage",
  "page": "flow",
  "sub": "choose"
 },
 {
  "label": "Eventnotizen und Zwischenstände",
  "page": "events",
  "sub": ""
 },
 {
  "label": "Livebild und Testfoto",
  "page": "camera",
  "sub": ""
 },
 {
  "label": "ISO · Blende · Verschlusszeit · Autofokus · Weißabgleich",
  "page": "cameraSettings",
  "sub": ""
 }
];
function openSettingsSearch(){
 let picked=0;openDialog('Einstellungen suchen',(body,ctx)=>{
 const input=el('input','settings-query');input.type='search';input.placeholder='z. B. Countdown, Hintergrund, WLAN';input.autocomplete='off';input.setAttribute('aria-label','Einstellungen suchen');input.setAttribute('role','combobox');input.setAttribute('aria-expanded','true');input.setAttribute('aria-controls','settings-results');
 const list=el('div','settings-results');list.id='settings-results';list.setAttribute('role','listbox');body.append(input,list);
 const jump=async item=>{ctx.close(true);if(item.page==='camera'){openCameraTest();return;}if(item.page==='cameraSettings'){openCameraSettings();return;}navigate(item.page,item.page==='flow'?'':item.sub,item.page==='flow'?{step:item.sub}:{});await new Promise(r=>requestAnimationFrame(r));const field=item.path?document.getElementById(fieldId(item.path)):null;if(field){let parent=field.parentElement;while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}field.closest('.field')?.scrollIntoView({block:'center',behavior:'smooth'});field.focus({preventScroll:true});field.closest('.field')?.classList.add('search-highlight');setTimeout(()=>field.closest('.field')?.classList.remove('search-highlight'),1600);}};
 const paint=()=>{const q=input.value.toLocaleLowerCase('de-DE').trim(),seen=new Set();list.replaceChildren();const items=settingsSearchEntries.filter(e=>{const text=e.label+' '+e.path+' '+e.sub;const key=e.page+'/'+e.sub+'/'+e.path+'/'+e.label;if(seen.has(key))return false;seen.add(key);return q.split(/\s+/).every(t=>text.toLocaleLowerCase('de-DE').includes(t));}).slice(0,25);picked=Math.max(0,Math.min(picked,items.length-1));for(const [i,item] of items.entries()){const b=button('',()=>jump(item),'search-result'+(i===picked?' active':''),'sliders');b.classList.remove('icon-only');b.id='search-result-'+i;b.setAttribute('role','option');b.setAttribute('aria-selected',String(i===picked));const text=el('span');text.append(el('strong','',item.label),el('small','',searchLocation(item)));b.append(text);list.append(b);}input.setAttribute('aria-activedescendant','search-result-'+picked);if(!items.length)list.append(el('p','empty','Keine passende Einstellung gefunden.'));};
 input.oninput=()=>{picked=0;paint();};input.onkeydown=e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();picked+=e.key==='ArrowDown'?1:-1;paint();list.children[picked]?.scrollIntoView({block:'nearest'});}if(e.key==='Enter'){e.preventDefault();list.children[picked]?.click();}};paint();
 },{cls:'settings-search-dialog',cancelText:'Schließen'});
}
$('#settings-search').onclick=openSettingsSearch;document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSettingsSearch();}});

function searchLocation(item){if(item.page.startsWith('camera'))return 'Kamera';const p=pageDef(item.page),sub=p.subs?.find(s=>s[0]===item.sub)?.[1]||({idle:'Bildschirmschoner',start:'Startseite',capture:'Aufnahme',result:'Ergebnis',choose:'Vorlagenwahl',welcome:'Auftakt'})[item.sub]||'';return [p.title,sub].filter(Boolean).join(' → ');}
