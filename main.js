const terminalPortfolio = (() => {
  // === DOM ELEMENTS ===
  const terminal = document.getElementById("main");
  const mobileCommandBar = document.getElementById("mobile-command-bar");

  // === STATE ===
  let commandHistory = [];
  let historyIndex = -1;
  let currentInputBuffer = "";

  // === TERMINAL FS STATE ===
  const HOME_DIR = "/home/sneha";
  let cwd = HOME_DIR;

  // === CONTENT SOURCE ===
  const content = {
    about_me: [
      "About Me",
      "--------",
      "Name: Sneha Bichkunde",
      "Email: bichkundesneha@gmail.com",
      "City: Nanded",
      "Education: B.Tech in Information Technology (8.3 GPA), SGGS Nanded",
      "Fun Fact: I love exploring systems through terminal commands!"
    ].join("\n"),
    hobbies: [
      "Hobbies",
      "-------",
      "Reading: Drama, Philosophy, Travel Journals",
      "Sports: Cycling, Badminton",
      "Programming: Data Structures & Algorithms, C++, System Design"
    ].join("\n"),
    interests: [
      "Interests",
      "---------",
      "Backend Development",
      "System Programming",
      "Distributed Systems"
    ].join("\n"),
    technical_skills: [
      "Technical Skills",
      "----------------",
      "Languages: C, C++, JavaScript",
      "Tools: Git, GitHub, Docker, VS Code, Bash, GDB, Makefile",
      "Frameworks: Node.js, Express.js, React.js, Socket.io",
      "Databases: MongoDB, MySQL",
      "Soft Skills: Problem-solving, Teamwork, Communication, Time Management"
    ].join("\n"),
    coding_profile: [
      "Coding Profile",
      "--------------",
      "GeeksforGeeks: Active contributor with 500+ problems solved in Data Structures and Algorithms",
      "URL: https://www.geeksforgeeks.org/user/bichkund5ad6/",
      "",
      "LeetCode: Solved 100+ problems, focused on algorithms and system design",
      "URL: https://leetcode.com/u/SnehaBichkunde/"
    ].join("\n"),
    coursework: [
      "Coursework",
      "----------",
      "Operating Systems",
      "Data Structures & Algorithms",
      "DBMS",
      "Computer Networks"
    ].join("\n"),
    projects: [
      "Use: cat projects/projects.txt"
    ].join("\n")
  };

  const projectsData = [
    {
      name: "Digital Diary",
      brief: "Secure diary app with authentication.",
      tech: "React, Node.js, MongoDB, JWT",
      live: "https://digital-diary-sneha.netlify.app/",
      github: "https://github.com/snehabichkunde/DigitalDiary"
    },
    {
      name: "my_shell",
      brief: "POSIX-style shell for terminal workflows.",
      tech: "C, ncurses",
      live: null,
      github: "https://github.com/snehabichkunde/c-shell"
    },
    {
      name: "Boids Flocking",
      brief: "Real-time boids simulation and visuals.",
      tech: "p5.js, JavaScript",
      live: "https://snehabichkunde.github.io/Flocking-Simulation-using-Quadtree/",
      github: "https://github.com/snehabichkunde/Flocking-Simulation-using-Quadtree"
    },
    {
      name: "Portfolio Terminal",
      brief: "CLI-style interactive portfolio.",
      tech: "JavaScript, HTML, CSS",
      live: null,
      github: "https://github.com/snehabichkunde/Portfolio_Terminal"
    },
    {
      name: "Snake Game",
      brief: "Classic snake game with collision logic.",
      tech: "C, SDL2",
      live: null,
      github: "https://github.com/your-username/your-snake-game-repo"
    }
  ];

  // === VIRTUAL FILESYSTEM ===
  const createDir = (children = {}) => ({ type: "dir", children });
  const createFile = (contentValue, options = {}) => ({ type: "file", content: contentValue, ...options });
  const createThemeEntry = (name, brief) => ({ type: "theme", name, brief });

  const fsTree = createDir({
    home: createDir({
      sneha: createDir({
        "about_me.txt": createFile(content.about_me),
        "hobbies.txt": createFile(content.hobbies),
        "interests.txt": createFile(content.interests),
        "coursework.txt": createFile(content.coursework),
        skills: createDir({
          "technical_skills.txt": createFile(content.technical_skills)
        }),
        coding_profile: createDir({
          "coding_profile.txt": createFile(content.coding_profile)
        }),
        themes: createDir({
          dark: createThemeEntry("dark", "High-contrast dark terminal theme for long sessions."),
          light: createThemeEntry("light", "Bright theme with strong readability in daylight."),
          matrix: createThemeEntry("matrix", "Green terminal aesthetic with matrix-inspired visuals."),
          hello_kitty: createThemeEntry("hello_kitty", "Soft pink playful look with readable text contrast.")
        }),
        projects: createDir({
          "projects.txt": createFile(content.projects)
        }),
        links: createDir({
          "github.txt": createFile("https://github.com/snehabichkunde"),
          "linkedin.txt": createFile("https://www.linkedin.com/in/sneha-bichkunde-aba203269/")
        }),
        "resume_sneha_bichkunde.pdf": createFile("PDF file", { binary: true })
      })
    })
  });

  const THEME_NAMES = ["dark", "light", "matrix", "hello_kitty"];

  // === HELPER FUNCTIONS ===
  function getPrompt() {
    return `<span class="prompt">sneha@portfolio:${getPromptPath()}$ </span>`;
  }

  function getPromptPath() {
    if (cwd === HOME_DIR) return "~";
    if (cwd.startsWith(`${HOME_DIR}/`)) return `~/${cwd.slice(HOME_DIR.length + 1)}`;
    return cwd;
  }

  function scrollToBottom() {
    terminal.scrollTop = terminal.scrollHeight;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function linkifyEscapedText(escapedText) {
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    return escapedText.replace(
      urlRegex,
      '<a href="$1" class="link" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  }

  function normalizePath(path) {
    const parts = path.split("/");
    const stack = [];
    for (const part of parts) {
      if (!part || part === ".") continue;
      if (part === "..") {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(part);
      }
    }
    return `/${stack.join("/")}`;
  }

  function resolvePath(inputPath = "") {
    if (!inputPath || inputPath === "~") return HOME_DIR;

    let path = inputPath;
    if (path.startsWith("~")) {
      path = path.replace(/^~/, HOME_DIR);
    } else if (!path.startsWith("/")) {
      path = `${cwd}/${path}`;
    }
    return normalizePath(path);
  }

  function getNodeByPath(path) {
    if (path === "/") return fsTree;

    const parts = path.split("/").filter(Boolean);
    let current = fsTree;

    for (const part of parts) {
      if (!current || current.type !== "dir") return null;
      current = current.children[part] || null;
      if (!current) return null;
    }

    return current;
  }

  function tryResolveFilePath(target) {
    if (!target) return null;

    const directPath = resolvePath(target);
    const directNode = getNodeByPath(directPath);
    if (directNode && directNode.type === "file") return directPath;

    const hasExtension = /\.[a-zA-Z0-9]+$/.test(target);
    if (hasExtension) return null;

    const fallbackExts = [".txt", ".md", ".json", ".url"];
    for (const ext of fallbackExts) {
      const candidatePath = resolvePath(`${target}${ext}`);
      const candidateNode = getNodeByPath(candidatePath);
      if (candidateNode && candidateNode.type === "file") return candidatePath;
    }

    return null;
  }

  function getPathCompletions(target, options = {}) {
    const { dirOnly = false, fileOnly = false } = options;
    const input = target || "";

    let parentInput = "";
    let namePrefix = input;
    const slashIndex = input.lastIndexOf("/");
    if (slashIndex >= 0) {
      parentInput = input.slice(0, slashIndex + 1);
      namePrefix = input.slice(slashIndex + 1);
    }

    const basePath = resolvePath(parentInput || ".");
    const baseNode = getNodeByPath(basePath);
    if (!baseNode || baseNode.type !== "dir") return [];

    return Object.keys(baseNode.children)
      .sort((a, b) => a.localeCompare(b))
      .filter((name) => name.startsWith(namePrefix))
      .filter((name) => {
        const child = baseNode.children[name];
        if (dirOnly) return child.type === "dir";
        if (fileOnly) return child.type === "file";
        return true;
      })
      .map((name) => {
        const child = baseNode.children[name];
        const suffix = child.type === "dir" ? "/" : "";
        return `${parentInput}${name}${suffix}`;
      });
  }

  function formatDirectoryList(dirNode) {
    const entries = Object.keys(dirNode.children).sort((a, b) => a.localeCompare(b));
    if (entries.length === 0) return `<span class="message">(empty)</span>`;

    const displayNames = entries.map((name) => {
      const entry = dirNode.children[name];
      return entry.type === "dir" ? `${name}/` : name;
    });

    const cols = window.innerWidth <= 600 ? 1 : 2;
    const rows = Math.ceil(displayNames.length / cols);
    const colWidth = Math.max(...displayNames.map((item) => item.length), 0) + 4;
    const lines = [];

    for (let r = 0; r < rows; r++) {
      let line = "";
      for (let c = 0; c < cols; c++) {
        const idx = r + c * rows;
        if (idx >= displayNames.length) continue;
        const item = displayNames[idx];
        line += item.padEnd(colWidth, " ");
      }
      lines.push(line.trimEnd());
    }

    return `<pre class="message ls-grid">${escapeHtml(lines.join("\n"))}</pre>`;
  }

  function focusInput() {
    const desktopInput = document.querySelector("#desktop-prompt .input");
    if (desktopInput) {
      desktopInput.focus();
      // Keep desktop caret behavior; mobile keyboards can behave poorly with forced ranges.
      if (window.innerWidth > 600) {
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(desktopInput);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }

  function placeCaretAtEnd(el) {
    if (!el) return;
    el.focus();
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (_err) {
      // Ignore caret placement failures on limited mobile browsers.
    }
  }

  function suggestCommand(input) {
    const suggestion = Object.keys(commands).find((cmd) => {
      let diff = 0;
      for (let i = 0; i < Math.min(input.length, cmd.length); i++) {
        if (input[i] !== cmd[i]) diff++;
      }
      diff += Math.abs(input.length - cmd.length);
      return diff <= 2;
    });
    return suggestion
      ? `<br><span class="suggest">Did you mean '<span class="command">${suggestion}</span>'?</span>`
      : "";
  }

  function catFile(target) {
    if (!target) {
      return `<span class="error">Usage: cat &lt;file&gt;</span>`;
    }

    const resolvedFilePath = tryResolveFilePath(target);
    if (!resolvedFilePath) {
      return `<span class="error">cat: ${escapeHtml(target)}: No such file</span>`;
    }

    const fileNode = getNodeByPath(resolvedFilePath);
    if (!fileNode || fileNode.type !== "file") {
      return `<span class="error">cat: ${escapeHtml(target)}: Not a file</span>`;
    }

    if (fileNode.binary) {
      return `<span class="message">Binary file: ${escapeHtml(resolvedFilePath)} (use <span class="command">getcv</span> to download)</span>`;
    }

    if (resolvedFilePath === "/home/sneha/projects/projects.txt") {
      return formatProjectsOutput();
    }

    const rawContent = fileNode.content || "";
    return `<span class="message">${linkifyEscapedText(escapeHtml(rawContent))}</span>`;
  }

  function getGithubIconSvg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.36 1.12 2.94.85.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.72 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.42.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.95.68 1.92 0 1.38-.01 2.5-.01 2.84 0 .28.18.6.69.5A10.25 10.25 0 0 0 22 12.23C22 6.58 17.52 2 12 2z"/></svg>`;
  }

  function formatProjectsOutput() {
    const isMobile = window.innerWidth <= 600;
    const rows = projectsData.map((project) => {
      const nameBlock = project.live
        ? `<a href="${project.live}" class="link" target="_blank" rel="noopener noreferrer">${escapeHtml(project.name)}</a>`
        : `<span class="message">${escapeHtml(project.name)}</span>`;
      const githubBlock = project.github
        ? `<a href="${project.github}" class="link" target="_blank" rel="noopener noreferrer" aria-label="GitHub ${escapeHtml(project.name)}">${getGithubIconSvg()}</a>`
        : "";
      if (isMobile) {
        return `<div class="project-item-line">${nameBlock} ${githubBlock}</div>`;
      }
      return `<div class="project-item-rich"><div class="project-item-line">${nameBlock} ${githubBlock}</div><div class="project-item-meta">Tech: ${escapeHtml(project.tech)}</div><div class="project-item-meta">${escapeHtml(project.brief)}</div></div>`;
    });

    return `<div class="message">${rows.join("")}</div>`;
  }

  // === COMMANDS OBJECT ===
  const commands = {
    help: () => [
      '<span class="header">Terminal Portfolio Commands</span>',
      '<span class="suggest">Navigate like a real terminal:</span>',
      '- <span class="command">pwd</span>: Show current directory',
      '- <span class="command">ls</span>: List folders/files (look for <span class="command">.txt</span> files)',
      '- <span class="command">cd &lt;dir&gt;</span>: Move directory (supports <span class="command">..</span>, <span class="command">/</span>, <span class="command">~</span>)',
      '- <span class="command">cat &lt;file&gt;</span>: Read a file (example: <span class="command">cat about_me</span> or <span class="command">cat about_me.txt</span>)',
      '- <span class="command">theme &lt;name&gt;</span> (or <span class="command">themes &lt;name&gt;</span>): Change theme (' + THEME_NAMES.join(", ") + ')',
      '',
      '<span class="suggest">Autocomplete:</span>',
      '- Press <span class="command">Tab</span> to autocomplete commands and paths for <span class="command">cd</span>, <span class="command">ls</span>, <span class="command">cat</span>',
      '- <span class="command">theme</span> and <span class="command">themes</span> also support Tab autocomplete for theme names',
      '- Use <span class="command">↑</span> and <span class="command">↓</span> to navigate command history',
      '',
      '<span class="suggest">Portfolio shortcuts:</span>',
      '- <span class="command">getcv</span>, <span class="command">getgithub</span>, <span class="command">getlinkedin</span>',
      '- <span class="command">history</span>, <span class="command">clear</span>',
      '',
      '<span class="note">Theme flow: <span class="command">cd themes</span> -> <span class="command">ls</span> -> <span class="command">matrix</span> (or any theme name).</span>'
    ].join("\n"),
    clear: () => {
      terminal.innerHTML = "";
      return null;
    },
    history: () => {
      if (commandHistory.length === 0) return `<span class="message">No command history yet.</span>`;
      return commandHistory.map((cmd, i) => `<span class="message">${i + 1}. ${escapeHtml(cmd)}</span>`).join("<br>");
    },
    pwd: () => `<span class="message">${escapeHtml(cwd)}</span>`,
    ls: (args) => {
      const targetPath = resolvePath(args[0] || ".");
      const node = getNodeByPath(targetPath);
      if (!node) return `<span class="error">ls: ${escapeHtml(args[0] || ".")}: No such file or directory</span>`;
      if (node.type === "file" || node.type === "theme") return `<span class="message">${escapeHtml(targetPath.split("/").pop())}</span>`;
      return formatDirectoryList(node);
    },
    cd: (args) => {
      const targetPath = resolvePath(args[0] || "~");
      const node = getNodeByPath(targetPath);
      if (!node) return `<span class="error">cd: ${escapeHtml(args[0] || "~")}: No such file or directory</span>`;
      if (node.type !== "dir") return `<span class="error">cd: ${escapeHtml(args[0] || "~")}: Not a directory</span>`;
      cwd = targetPath;
      return null;
    },
    cat: (args) => catFile(args.join(" ").trim()),

    // Compatibility aliases
    "about-me": () => catFile("about_me"),
    hobbies: () => catFile("hobbies"),
    interests: () => catFile("interests"),
    "technical-skills": () => catFile("skills/technical_skills"),
    "coding-profiles": () => catFile("coding_profile/coding_profile"),
    coursework: () => catFile("coursework"),
    "my-projects": () => catFile("projects/projects"),

    getcv: async () => {
      const resumeUrl = "resume_sneha_bichkunde.pdf";
      try {
        const response = await fetch(resumeUrl);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`File not found at path: ${resumeUrl}`);
          }
          throw new Error(`Network error! Status: ${response.status}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "resume_sneha_bichkunde.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return `<span class="message">Downloading CV... Please check your downloads folder!</span>`;
      } catch (error) {
        console.error("CV download failed:", error);
        return `<span class="error">Error: Could not download CV. The file may be missing or inaccessible.</span>`;
      }
    },
    getlinkedin: () => {
      window.open("https://www.linkedin.com/in/sneha-bichkunde-aba203269/", "_blank");
      return `<span class="message">Opening LinkedIn profile...</span>`;
    },
    getgithub: () => {
      window.open("https://github.com/snehabichkunde", "_blank");
      return `<span class="message">Opening GitHub profile...</span>`;
    },
    themes: (args) => {
      if (!args[0]) {
        return `<span class="message">Available themes: ${THEME_NAMES.join(", ")}</span><br><span class="message">Usage: themes &lt;theme-name&gt;</span>`;
      }

      const theme = args[0];
      if (THEME_NAMES.includes(theme)) {
        document.body.className = `theme-${theme}`;
        localStorage.setItem("theme", theme);
        window.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme } }));
        return `<span class="message">Theme switched to ${escapeHtml(theme)}</span>`;
      }

      return `<span class="error">Invalid theme.</span>`;
    },
    theme: (args) => commands.themes(args)
  };

  THEME_NAMES.forEach((themeName) => {
    commands[themeName] = () => commands.themes([themeName]);
  });

  // === CORE LOGIC ===
  async function typeWelcomeMessage() {
    const TYPING_SPEED_MS = 30;
    const isMobile = window.innerWidth <= 600;

    const welcomeMessage = isMobile
      ? `
<div class="message">Welcome to Sneha's Terminal Portfolio!</div>
<div class="suggest">Start with the command <span class="command">help</span>.</div>
`
      : `
<div class="message">Initializing session for user: guest...</div>
<div class="message">Connection established.</div>
<div class="header">Welcome to Sneha Bichkunde's digital space.</div>
<div class="suggest">Start with the command <span class="command">help</span>.</div>
`;

    let isTyping = true;
    const skipAnimation = () => {
      isTyping = false;
    };

    document.addEventListener("keydown", skipAnimation, { once: true });
    document.addEventListener("click", skipAnimation, { once: true });

    const container = document.createElement("div");
    container.className = "output";
    terminal.appendChild(container);

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = welcomeMessage.trim();

    async function typeNode(node, parentEl) {
      if (!isTyping) return;

      if (node.nodeType === Node.TEXT_NODE) {
        for (const char of node.textContent) {
          if (!isTyping) break;
          parentEl.innerHTML += char;
          await new Promise((r) => setTimeout(r, TYPING_SPEED_MS));
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = document.createElement(node.nodeName);
        for (const attr of node.attributes) el.setAttribute(attr.name, attr.value);
        parentEl.appendChild(el);
        for (const child of node.childNodes) {
          await typeNode(child, el);
        }
      }
    }

    for (const node of tempDiv.childNodes) {
      await typeNode(node, container);
    }

    if (!isTyping) container.innerHTML = welcomeMessage.trim();

    document.removeEventListener("keydown", skipAnimation);
    document.removeEventListener("click", skipAnimation);

    appendNewDesktopPrompt();
    focusInput();

    scrollToBottom();
  }

  function typeOutput(output) {
    const outputDiv = document.createElement("div");
    outputDiv.className = "output";
    outputDiv.innerHTML = output.trim();
    terminal.appendChild(outputDiv);
  }

  function appendNewDesktopPrompt() {
    const newPrompt = document.createElement("div");
    newPrompt.className = "prompt-line";
    newPrompt.id = "desktop-prompt";
    newPrompt.innerHTML = `${getPrompt()}<span class="input" contenteditable="true" spellcheck="false"></span>`;
    terminal.appendChild(newPrompt);
  }

  async function executeCommand(commandStr) {
    const trimmedCmd = commandStr.trim();

    const currentPrompt = document.getElementById("desktop-prompt");
    if (currentPrompt) {
      currentPrompt.removeAttribute("id");
      currentPrompt.querySelector(".input").textContent = trimmedCmd;
      currentPrompt.querySelector(".input").contentEditable = "false";
    } else {
      const logLine = document.createElement("div");
      logLine.className = "prompt-line";
      logLine.innerHTML = `${getPrompt()}<span class="executed-cmd">${escapeHtml(trimmedCmd)}</span>`;
      terminal.appendChild(logLine);
    }

    if (trimmedCmd) {
      commandHistory.push(trimmedCmd);
      historyIndex = commandHistory.length;
      currentInputBuffer = "";
    }

    const parts = trimmedCmd.split(/\s+/).filter(Boolean);
    const command = parts[0];
    const args = parts.slice(1);
    let output;

    if (command && commands[command]) {
      output = await Promise.resolve(commands[command](args));
    } else if (command) {
      output = `<span class="error">${escapeHtml(command)}: command not found</span>${suggestCommand(command)}`;
    }

    if (output !== null && output !== undefined) typeOutput(output);
    appendNewDesktopPrompt();
    scrollToBottom();
    focusInput();
  }

  // === MOBILE-SPECIFIC FUNCTIONS ===
  function handleDesktopRecommendation() {
    if (window.innerWidth > 600) return;
    const banner = document.createElement("div");
    banner.className = "desktop-rec-banner";
    banner.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
      <p>For the full interactive experience, please view on a desktop.</p>
      <button class="close-banner-btn">×</button>
    `;
    terminal.prepend(banner);
    banner.querySelector(".close-banner-btn").onclick = () => {
      banner.style.display = "none";
    };
  }

  function populateMobileCommands(menu = "main") {
    if (!mobileCommandBar || window.innerWidth > 600) return;
    mobileCommandBar.style.display = "none";
    mobileCommandBar.innerHTML = "";

    let commandsToShow;

    if (menu === "themes") {
      commandsToShow = [...THEME_NAMES, "back"];
    } else {
      commandsToShow = [
        "help",
        "ls",
        "pwd",
        "cat about_me",
        "getcv",
        "themes",
        "clear"
      ];
    }

    commandsToShow.forEach((cmd) => {
      const chip = document.createElement("button");
      chip.className = "command-chip";
      chip.textContent = cmd.replace(/-/g, " ");

      if (cmd === "help" && menu === "main") {
        chip.classList.add("highlight-chip");
      }

      if (cmd === "back") {
        chip.classList.add("back-chip");
        chip.onclick = () => populateMobileCommands("main");
      } else if (cmd === "themes" && menu === "main") {
        chip.onclick = () => populateMobileCommands("themes");
      } else if (menu === "themes") {
        chip.onclick = () => {
          executeCommand(`themes ${cmd}`);
          populateMobileCommands("main");
        };
      } else {
        chip.onclick = () => executeCommand(cmd);
      }

      mobileCommandBar.appendChild(chip);
    });

    const scrollIndicator = document.createElement("div");
    scrollIndicator.className = "scroll-indicator";
    scrollIndicator.innerHTML = "<span>← Scroll for more →</span>";
    mobileCommandBar.appendChild(scrollIndicator);
  }

  // === EVENT LISTENERS ===
  function setupEventListeners() {
    terminal.addEventListener("keydown", async (e) => {
      const desktopInput = document.querySelector("#desktop-prompt .input");
      if (!desktopInput) return;

      if (e.key === "Enter") {
        e.preventDefault();
        await executeCommand(desktopInput.textContent);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyIndex > 0) {
          if (historyIndex === commandHistory.length) currentInputBuffer = desktopInput.textContent;
          historyIndex--;
          desktopInput.textContent = commandHistory[historyIndex] || "";
          focusInput();
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          desktopInput.textContent = commandHistory[historyIndex] || "";
        } else {
          historyIndex = commandHistory.length;
          desktopInput.textContent = currentInputBuffer;
        }
        focusInput();
      } else if (e.key === "Tab") {
        e.preventDefault();
        const rawInput = desktopInput.textContent;
        const trimmedInput = rawInput.trim();
        if (!trimmedInput) return;

        const endsWithSpace = /\s$/.test(rawInput);
        const tokens = trimmedInput.split(/\s+/);
        const commandToken = tokens[0];
        const completingCommand = tokens.length === 1 && !endsWithSpace;

        if (completingCommand) {
          const matches = Object.keys(commands).filter((cmd) => cmd.startsWith(commandToken));
          if (matches.length === 1) {
            desktopInput.textContent = `${matches[0]} `;
            placeCaretAtEnd(desktopInput);
          } else if (matches.length > 1) {
            const commonPrefix = findLongestCommonPrefix(matches);
            if (desktopInput.textContent.trim() === commonPrefix) {
              typeOutput(`<div class="suggest">${matches.join("  ")}</div>`);
              scrollToBottom();
            }
            desktopInput.textContent = commonPrefix;
            placeCaretAtEnd(desktopInput);
          }
          return;
        }

        if (!(commandToken === "cd" || commandToken === "cat" || commandToken === "ls" || commandToken === "theme" || commandToken === "themes")) return;

        const argPrefix = endsWithSpace ? "" : tokens[tokens.length - 1];
        let matches = [];
        if (commandToken === "cd") {
          matches = getPathCompletions(argPrefix, { dirOnly: true });
        } else if (commandToken === "cat") {
          matches = getPathCompletions(argPrefix, { fileOnly: true });
        } else if (commandToken === "theme" || commandToken === "themes") {
          matches = THEME_NAMES.filter((name) => name.startsWith(argPrefix));
        } else {
          matches = getPathCompletions(argPrefix);
        }

        if (matches.length === 0) return;
        if (matches.length === 1) {
          desktopInput.textContent = `${commandToken} ${matches[0]} `;
          placeCaretAtEnd(desktopInput);
          return;
        }

        const commonPrefix = findLongestCommonPrefix(matches);
        const nextValue = `${commandToken} ${commonPrefix}`;
        if (desktopInput.textContent.trim() === nextValue.trim()) {
          typeOutput(`<div class="suggest">${matches.join("  ")}</div>`);
          scrollToBottom();
        }
        desktopInput.textContent = nextValue;
        placeCaretAtEnd(desktopInput);
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest(".terminal-wrapper") && !e.target.closest("a") && !e.target.closest("button")) {
        focusInput();
      }
    });
  }

  // === INITIALIZATION ===
  return {
    init: async () => {
      terminal.innerHTML = "";
      cwd = HOME_DIR;

      const savedTheme = localStorage.getItem("theme") || "dark";
      document.body.className = `theme-${savedTheme}`;

      handleDesktopRecommendation();
      populateMobileCommands();
      setupEventListeners();

      await typeWelcomeMessage();
    }
  };
})();

function findLongestCommonPrefix(strs) {
  if (!strs || strs.length === 0) return "";
  strs.sort();
  const first = strs[0];
  const last = strs[strs.length - 1];
  let i = 0;
  while (i < first.length && first[i] === last[i]) i++;
  return first.substring(0, i);
}

document.addEventListener("DOMContentLoaded", () => {
  terminalPortfolio.init();
});
