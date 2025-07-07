# Prakhar Gyan

Prakhar Gyan is a web application for cropping, editing, and saving regions of images—such as newspaper scans or articles. The app provides a browser-based image editor with advanced cropping, blurring, undo/redo, and article card creation features. It also supports converting PDF files to images and uploading images to AWS S3.

---

## Features

- **Interactive Image Editor**: Crop, blur, and manipulate regions of an image using Cropper.js and jQuery.
- **Article Management**: Save cropped regions as "articles" with titles and previews, managed in the browser.
- **Undo/Redo & Shortcuts**: Efficient editing with undo/redo stacks and keyboard shortcuts.
- **PDF to Image Conversion**: Convert PDF files to PNG images for further processing.
- **AWS S3 Upload**: Upload images to AWS S3 for cloud storage.
- **Responsive UI**: Bootstrap-based interface with modals and carousels for a smooth user experience.

---

## Main Components

- **index.js**  
  Express server that serves static files and the main HTML interface.

- **public/canvas.js**  
  Core frontend logic for image editing, cropping, and article management.

- **public/index.html**  
  Main user interface for editing and saving image regions.

- **public/newspaper.html**  
  Alternative UI with an image map for region selection and modal previews.

- **aws.js**  
  Script for uploading images to AWS S3 using AWS SDK and Cognito credentials.

- **pdfcutter.js**  
  Script for converting PDF files to PNG images using the `pdf2img` library.

- **shellnode.js**  
  Utility for running shell scripts from Node.js, useful for image processing tasks.

---

## Basic Usage

1. **Start the Server**

   This project now uses [uv](https://github.com/astral-sh/uv) and [Uvicorn](https://www.uvicorn.org/) to run the FastAPI backend.

   If you don't have `uv` installed, follow the instructions at [https://github.com/astral-sh/uv](https://github.com/astral-sh/uv).

   ```bash
   uv run uvicorn main:app --reload --port 3000
   ```

   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

2. **Image Editing**
   - Use the editor to crop, blur, and save regions of the loaded image (`pic.jpg` by default).
   - Save cropped regions as articles, which are stored in localStorage and displayed as cards.

3. **PDF to Image Conversion**
   - Place your PDF as `in.pdf` in the project root.
   - Run:
     ```bash
     node pdfcutter.js
     ```
   - Output images will be saved in the `public/` directory.

4. **Upload to AWS S3**
   - Configure your AWS credentials in `aws.js`.
   - Place the image you want to upload as `pic.jpg` in the project root.
   - Run:
     ```bash
     node aws.js
     ```
   - The image will be uploaded to the configured S3 bucket.

---

## Dependencies

- [Express](https://expressjs.com/)
- [jQuery](https://jquery.com/)
- [Bootstrap](https://getbootstrap.com/)
- [Cropper.js](https://fengyuanchen.github.io/cropperjs/)
- [AWS SDK](https://www.npmjs.com/package/aws-sdk)
- [pdf2img](https://www.npmjs.com/package/pdf2img)

---

## Project Structure

```
.
├── index.js
├── aws.js
├── pdfcutter.js
├── shellnode.js
├── public/
│   ├── canvas.js
│   ├── index.html
│   ├── newspaper.html
│   └── ...
├── pic.jpg
├── in.pdf
└── ...
```

---

## Detailed Cropping Workflow

### 1. Loading the Image

- The main image (`pic.jpg` by default) is loaded into the editor via the `<img id="image">` element in `public/index.html`.
- On page load, `public/canvas.js` initializes the cropping editor by calling `startCanvasEditor()`.

### 2. Initializing the Cropper

- The `startCanvasEditor` function in `public/canvas.js` attaches Cropper.js to the `#image` element:
  ```js
  $('#image').cropper({ viewMode: 1, crop: function(e) { /* ... */ } });
  ```
- This enables interactive cropping and region selection on the image.

### 3. User Interaction & Region Selection

- Users can select regions using the Cropper.js UI.
- Keyboard shortcuts are set up for efficient editing:
  - **Enter**: Finalizes the current selection, saves the cropped region, and opens the "Save News Clip" modal.
  - **Space**: Marks a region to be included (green overlay).
  - **Delete**: Marks a region to be excluded (red overlay).
  - **Escape**: Clears the current crop selection.
  - **Ctrl+Z / Ctrl+R**: Undo/Redo region selections.

### 4. Cropping and Saving Regions

- When Enter is pressed, the following occurs:
  - `SaveState()` saves the current selection stack.
  - `clearRect(image)` processes all selected regions:
    - Calculates the bounding box for all included regions.
    - Creates a new canvas and copies the selected image data.
    - Stores the cropped image as a Data URL in `localStorage` with a unique name (e.g., `CroppedArticle_<timestamp>`).
    - Calls `createArticleCard()` to display the cropped article as a card in the UI.

### 5. Managing Cropped Articles

- Cropped articles are managed in the `CroppedArticles` array and stored in `localStorage`.
- Each article card displays a preview and a button to set it as the main image for further editing.
- The modal (`#saveNewsClip`) allows users to name and preview the cropped article before saving.

### 6. Undo/Redo and State Management

- All region selections are tracked in the `MainStack` and `StackMoves` arrays.
- Undo/Redo operations manipulate these stacks and redraw the image overlays accordingly.

### 7. Data Persistence

- Cropped images are stored in the browser's `localStorage` as Data URLs.
- Article metadata (name, image) is managed in memory and via the UI.

### 8. (Optional) Uploading Cropped Images

- To upload images to AWS S3, use the `aws.js` script. You may need to export or download the cropped Data URL and save it as a file before uploading.

---

## License

This project is for educational and demonstration purposes.
