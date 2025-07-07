document.addEventListener("DOMContentLoaded", function () {
 
  hljs.highlightAll();

 
  const newEntryBtn = document.getElementById("newEntryBtn");
  const entryForm = document.getElementById("entryForm");
  const cancelEntryBtn = document.getElementById("cancelEntryBtn");
  const saveEntryBtn = document.getElementById("saveEntryBtn");
  const entriesContainer = document.getElementById("entriesContainer");
  const entryTypeBtns = document.querySelectorAll(".entry-type-btn");
  const contentGroup = document.getElementById("contentGroup");
  const codeGroup = document.getElementById("codeGroup");
  const resourceGroup = document.getElementById("resourceGroup");
  const tagFilters = document.getElementById("tagFilters");
  const searchBar = document.querySelector(".search-bar");
  const aiAssistantBtn = document.getElementById("aiAssistantBtn");
  const aiPanel = document.getElementById("aiPanel");
  const closeAiBtn = document.getElementById("closeAiBtn");
  const aiMessages = document.getElementById("aiMessages");
  const aiInput = document.getElementById("aiInput");
  const sendAiBtn = document.getElementById("sendAiBtn");
  const entryModal = document.getElementById("entryModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  const modalCloseBtn = document.getElementById("modalCloseBtn");


  let entries = JSON.parse(localStorage.getItem("codejourney-entries")) || [];
  let currentEntryType = "note";
  let currentFilter = "all";
  let currentSearch = "";
  let editingEntryId = null;


  function init() {
    renderEntries();
    setupEventListeners();
  }

  function setupEventListeners() {
    newEntryBtn.addEventListener("click", showEntryForm);
    cancelEntryBtn.addEventListener("click", hideEntryForm);
    saveEntryBtn.addEventListener("click", saveEntry);

    entryTypeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        entryTypeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentEntryType = btn.dataset.type;
        updateFormFields();
      });
    });

    tagFilters.addEventListener("click", (e) => {
      if (e.target.classList.contains("tag")) {
        document.querySelectorAll(".tag").forEach((tag) => {
          tag.classList.remove("active");
        });
        e.target.classList.add("active");
        currentFilter = e.target.dataset.tag;
        renderEntries();
      }
    });

    searchBar.addEventListener("input", (e) => {
      currentSearch = e.target.value.toLowerCase();
      renderEntries();
    });

    aiAssistantBtn.addEventListener("click", toggleAiPanel);
    closeAiBtn.addEventListener("click", toggleAiPanel);
    sendAiBtn.addEventListener("click", sendAiMessage);
    aiInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendAiMessage();
      }
    });

    modalCloseBtn.addEventListener("click", () => {
      entryModal.classList.remove("active");
    });
  }

  
  function showEntryForm() {
    entryForm.style.display = "block";
    newEntryBtn.style.display = "none";
    resetForm();
  }

  function hideEntryForm() {
    entryForm.style.display = "none";
    newEntryBtn.style.display = "inline-flex";
    editingEntryId = null;
  }

  
  function updateFormFields() {
    contentGroup.style.display = "none";
    codeGroup.style.display = "none";
    resourceGroup.style.display = "none";

    if (currentEntryType === "note") {
      contentGroup.style.display = "block";
    } else if (currentEntryType === "code") {
      codeGroup.style.display = "block";
    } else if (currentEntryType === "resource") {
      resourceGroup.style.display = "block";
    }
  }


  function resetForm() {
    document.getElementById("entryTitle").value = "";
    document.getElementById("entryContent").value = "";
    document.getElementById("codeContent").value = "";
    document.getElementById("resourceUrl").value = "";
    document.getElementById("resourceDescription").value = "";
    document.getElementById("entryTags").value = "";
    currentEntryType = "note";
    entryTypeBtns.forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.type === "note") {
        btn.classList.add("active");
      }
    });
    updateFormFields();
  }


  function saveEntry() {
    const title = document.getElementById("entryTitle").value.trim();
    const tags = document
      .getElementById("entryTags")
      .value.split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    if (!title) {
      alert("Please enter a title");
      return;
    }

    let content = "";
    if (currentEntryType === "note") {
      content = document.getElementById("entryContent").value.trim();
    } else if (currentEntryType === "code") {
      content = document.getElementById("codeContent").value.trim();
      if (!content) {
        alert("Please enter some code");
        return;
      }
    } else if (currentEntryType === "resource") {
      const url = document.getElementById("resourceUrl").value.trim();
      if (!url) {
        alert("Please enter a URL");
        return;
      }
      content = {
        url: url,
        description: document
          .getElementById("resourceDescription")
          .value.trim(),
      };
    }

    const entry = {
      id: editingEntryId || Date.now().toString(),
      type: currentEntryType,
      title: title,
      content: content,
      tags: tags,
      date: new Date().toISOString(),
      language:
        currentEntryType === "code"
          ? document.getElementById("codeLanguage").value
          : null,
    };

    if (editingEntryId) {
   
      const index = entries.findIndex((e) => e.id === editingEntryId);
      if (index !== -1) {
        entries[index] = entry;
      }
    } else {
      // Add new entry
      entries.unshift(entry);
    }

    localStorage.setItem("codejourney-entries", JSON.stringify(entries));
    renderEntries();
    hideEntryForm();
  }


  function renderEntries() {
    let filteredEntries = [...entries];


    if (currentFilter !== "all") {
      filteredEntries = filteredEntries.filter(
        (entry) =>
          entry.tags.includes(currentFilter) ||
          entry.type === currentFilter ||
          entry.language === currentFilter
      );
    }

    if (currentSearch) {
      filteredEntries = filteredEntries.filter((entry) => {
        const searchFields = [
          entry.title,
          typeof entry.content === "string" ? entry.content : "",
          entry.type === "resource" ? entry.content.url : "",
          entry.type === "resource" ? entry.content.description : "",
          entry.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return searchFields.includes(currentSearch);
      });
    }

    if (filteredEntries.length === 0) {
      entriesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-code-branch"></i>
                    <h3>No entries found</h3>
                    <p>Try changing your search or filter criteria</p>
                </div>
            `;
      return;
    }

    entriesContainer.innerHTML = "";
    filteredEntries.forEach((entry) => {
      const entryElement = createEntryElement(entry);
      entriesContainer.appendChild(entryElement);
    });
  }


  function createEntryElement(entry) {
    const entryElement = document.createElement("div");
    entryElement.className = "entry-card";
    entryElement.dataset.id = entry.id;

    let contentHtml = "";
    if (entry.type === "note") {
      contentHtml = `<div class="content">${formatContent(
        entry.content
      )}</div>`;
    } else if (entry.type === "code") {
      contentHtml = `
                <div class="code-header">
                    <span class="language-label">${entry.language}</span>
                    <button class="copy-btn" data-code="${escapeHtml(
                      entry.content
                    )}">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <pre><code class="language-${entry.language}">${escapeHtml(
        entry.content
      )}</code></pre>
            `;
    } else if (entry.type === "resource") {
      contentHtml = `
                <div class="content">
                    <p><a href="${entry.content.url}" target="_blank">${
        entry.content.url
      }</a></p>
                    <p>${formatContent(entry.content.description)}</p>
                </div>
            `;
    }

    entryElement.innerHTML = `
            <h3>${entry.title}</h3>
            <div class="date">${formatDate(entry.date)}</div>
            ${contentHtml}
            <div class="entry-tags">
                ${entry.tags
                  .map((tag) => `<span class="entry-tag">${tag}</span>`)
                  .join("")}
            </div>
            <div class="actions">
                <button class="btn btn-outline edit-btn">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-outline delete-btn">
                    <i class="fas fa-trash"></i> Delete
                </button>
                ${
                  entry.type === "code"
                    ? `
                    <button class="btn btn-outline explain-btn">
                        <i class="fas fa-robot"></i> Explain
                    </button>
                `
                    : ""
                }
            </div>
        `;


    const editBtn = entryElement.querySelector(".edit-btn");
    const deleteBtn = entryElement.querySelector(".delete-btn");
    const explainBtn = entryElement.querySelector(".explain-btn");
    const copyBtn = entryElement.querySelector(".copy-btn");

    editBtn.addEventListener("click", () => editEntry(entry.id));
    deleteBtn.addEventListener("click", () => deleteEntry(entry.id));
    if (explainBtn) {
      explainBtn.addEventListener("click", () => explainCode(entry));
    }
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(entry.content);
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        }, 2000);
      });
    }


    if (entry.type === "code") {
      const codeBlock = entryElement.querySelector("code");
      hljs.highlightElement(codeBlock);
    }

    return entryElement;
  }


  function editEntry(id) {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;

    editingEntryId = id;
    showEntryForm();

    document.getElementById("entryTitle").value = entry.title;
    document.getElementById("entryTags").value = entry.tags.join(", ");

    entryTypeBtns.forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.type === entry.type) {
        btn.classList.add("active");
      }
    });
    currentEntryType = entry.type;
    updateFormFields();

    if (entry.type === "note") {
      document.getElementById("entryContent").value = entry.content;
    } else if (entry.type === "code") {
      document.getElementById("codeContent").value = entry.content;
      document.getElementById("codeLanguage").value = entry.language;
    } else if (entry.type === "resource") {
      document.getElementById("resourceUrl").value = entry.content.url;
      document.getElementById("resourceDescription").value =
        entry.content.description;
    }
  }


  function deleteEntry(id) {
    if (confirm("Are you sure you want to delete this entry?")) {
      entries = entries.filter((e) => e.id !== id);
      localStorage.setItem("codejourney-entries", JSON.stringify(entries));
      renderEntries();
    }
  }


  function explainCode(entry) {
    toggleAiPanel();
    addAiMessage(
      "user",
      `Can you explain this ${entry.language} code?\n\n${entry.content}`
    );
    simulateAiResponse(`This is a ${entry.language} code snippet. Here's what it does:

[Explanation would appear here. In a real implementation, this would call the OpenAI API to generate an explanation.]

For a real explanation, you would need to connect this app to the OpenAI API by:
1. Getting an API key from OpenAI
2. Uncommenting the fetchAIResponse() function in the code
3. Adding your API key to the request`);
  }

  // Toggle AI panel
  function toggleAiPanel() {
    aiPanel.classList.toggle("active");
    if (aiPanel.classList.contains("active")) {
      aiInput.focus();
    }
  }


  function addAiMessage(role, content) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `ai-message ${role}`;
    messageDiv.textContent = content;
    aiMessages.appendChild(messageDiv);
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }


  function sendAiMessage() {
    const message = aiInput.value.trim();
    if (!message) return;

    addAiMessage("user", message);
    aiInput.value = "";

   
    simulateAiResponse(`I'm your AI assistant. In a real implementation, this would be the response from the OpenAI API.

To connect the real API:
1. Get an API key from OpenAI
2. Uncomment the fetchAIResponse() function in the code
3. Add your API key to the request`);
  }


  function simulateAiResponse(response) {
    setTimeout(() => {
      addAiMessage("assistant", response);
    }, 1000);
  }

  
  function formatDate(dateString) {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }

  function formatContent(content) {
    return content.replace(/\n/g, "<br>");
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  init();
});
