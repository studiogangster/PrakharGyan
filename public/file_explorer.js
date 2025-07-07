/**
 * File Explorer UI for pdf_storage
 * - Fetches paginated directory listings from /api/filesystem
 * - Renders a tree/list with expand/collapse for folders
 * - Infinite scroll for large folders
 */

const API_URL = "/api/filesystem";
const explorer = document.getElementById("file-explorer");

function createFolderNode(name, fullPath, depth = 0) {
  const folder = document.createElement("div");
  folder.className = "fe-folder";
  folder.style.marginLeft = `${depth * 16}px`;
  folder.style.cursor = "pointer";
  folder.innerHTML = `<span style="font-weight:bold;">📁 ${name}</span> <span class="fe-toggle" style="font-size:12px;color:#aaa;">[+]</span>`;
  folder.dataset.expanded = "false";
  folder.dataset.fullPath = fullPath;
  folder.onclick = function (e) {
    e.stopPropagation();
    if (folder.dataset.expanded === "false") {
      expandFolder(folder, fullPath, depth + 1);
    } else {
      collapseFolder(folder);
    }
  };
  return folder;
}

function createFileNode(name, fullPath, depth = 0) {
  const file = document.createElement("div");
  file.className = "fe-file";
  file.style.marginLeft = `${depth * 16}px`;
  file.innerHTML = `<span>📄 ${name}</span>`;
  file.dataset.fullPath = fullPath;
  // Optionally, add click handler for file preview
  return file;
}

function showLoading(parent) {
  const loading = document.createElement("div");
  loading.className = "fe-loading";
  loading.style.marginLeft = "16px";
  loading.textContent = "Loading...";
  parent.appendChild(loading);
  return loading;
}

function removeLoading(parent) {
  const loading = parent.querySelector(".fe-loading");
  if (loading) parent.removeChild(loading);
}

async function fetchDirectory(path = "", page = 1, page_size = 20) {
  const url = `${API_URL}?path=${encodeURIComponent(path)}&page=${page}&page_size=${page_size}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Failed to fetch directory");
  return await resp.json();
}

function renderDirectory(parent, items, fullPath, depth, hasMore, loadMoreCallback) {
  items.forEach(item => {
    if (item.type === "directory") {
      const folderNode = createFolderNode(item.name, fullPath ? `${fullPath}/${item.name}` : item.name, depth);
      parent.appendChild(folderNode);
    } else {
      const fileNode = createFileNode(item.name, fullPath ? `${fullPath}/${item.name}` : item.name, depth);
      parent.appendChild(fileNode);
    }
  });
  if (hasMore) {
    const loadMore = document.createElement("div");
    loadMore.className = "fe-load-more";
    loadMore.style.marginLeft = `${depth * 16}px`;
    loadMore.style.color = "#0af";
    loadMore.style.cursor = "pointer";
    loadMore.textContent = "Load more...";
    loadMore.onclick = function (e) {
      e.stopPropagation();
      loadMoreCallback();
    };
    parent.appendChild(loadMore);
  }
}

async function expandFolder(folder, fullPath, depth) {
  folder.dataset.expanded = "true";
  folder.querySelector(".fe-toggle").textContent = "[-]";
  // Prevent double expansion
  if (folder.nextSibling && folder.nextSibling.classList.contains("fe-folder-children")) {
    folder.nextSibling.style.display = "block";
    return;
  }
  const childrenContainer = document.createElement("div");
  childrenContainer.className = "fe-folder-children";
  childrenContainer.style.marginLeft = "0";
  folder.parentNode.insertBefore(childrenContainer, folder.nextSibling);

  let page = 1;
  let hasMore = true;
  let loading = showLoading(childrenContainer);

  async function loadPage() {
    try {
      removeLoading(childrenContainer);
      loading = showLoading(childrenContainer);
      const data = await fetchDirectory(fullPath, page);
      removeLoading(childrenContainer);
      renderDirectory(
        childrenContainer,
        data.items,
        fullPath,
        depth,
        data.has_more,
        () => {
          page += 1;
          loadPage();
        }
      );
      hasMore = data.has_more;
    } catch (err) {
      removeLoading(childrenContainer);
      const errDiv = document.createElement("div");
      errDiv.style.color = "red";
      errDiv.textContent = "Error loading folder";
      childrenContainer.appendChild(errDiv);
    }
  }

  await loadPage();
}

function collapseFolder(folder) {
  folder.dataset.expanded = "false";
  folder.querySelector(".fe-toggle").textContent = "[+]";
  if (folder.nextSibling && folder.nextSibling.classList.contains("fe-folder-children")) {
    folder.nextSibling.style.display = "none";
  }
}

async function loadRoot() {
  explorer.innerHTML = "";
  let page = 1;
  let hasMore = true;

  async function loadPage() {
    const data = await fetchDirectory("", page);
    renderDirectory(
      explorer,
      data.items,
      "",
      0,
      data.has_more,
      () => {
        page += 1;
        loadPage();
      }
    );
    hasMore = data.has_more;
  }

  try {
    showLoading(explorer);
    await loadPage();
    removeLoading(explorer);
  } catch (err) {
    console.log(err)
    removeLoading(explorer);
    const errDiv = document.createElement("div");
    errDiv.style.color = "red";
    errDiv.textContent = "Error loading file explorer";
    explorer.appendChild(errDiv);
  }
}

// Initialize on DOMContentLoaded
if (explorer) {
  document.addEventListener("DOMContentLoaded", loadRoot);
}
