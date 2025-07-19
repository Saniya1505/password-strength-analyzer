let dictionary = [];

fetch("words_alpha.txt")
  .then(response => response.text())
  .then(data => {
    dictionary = data.split("\n").map(word => word.trim().toLowerCase());
  });

const commonWords = [
  "password", "123456", "qwerty", "abc123", "football", "letmein", "monkey",
  "sunshine", "iloveyou", "admin", "welcome", "login", "dragon", "princess",
  "flower", "sunflower", "baseball", "superman", "batman", "trustno1"
];

function containsDictionaryWord(password) {
  const lowerPass = password.toLowerCase();
  return dictionary.some(word => word.length >= 4 && lowerPass.includes(word));
}

function hasKeyboardPattern(password) {
  const patterns = [
    "qwertyuiop", "asdfghjkl", "zxcvbnm", "1234567890", "abcdefghijklmnopqrstuvwxyz"
  ];
  const lower = password.toLowerCase();
  return patterns.some(pattern => {
    for (let i = 0; i < pattern.length - 2; i++) {
      const chunk = pattern.slice(i, i + 3);
      if (lower.includes(chunk) || lower.includes(chunk.split('').reverse().join(''))) {
        return true;
      }
    }
    return false;
  });
}

function calculateEntropy(password) {
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^A-Za-z0-9]/.test(password)) charsetSize += 32; // rough estimate
  const entropy = Math.log2(Math.pow(charsetSize, password.length));
  return entropy.toFixed(2);
}

async function checkPwned(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha1Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  const prefix = sha1Hash.slice(0, 5);
  const suffix = sha1Hash.slice(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  const text = await response.text();

  return text.includes(suffix);
}

async function analyzePassword() {
  const password = document.getElementById("password").value;
  const result = document.getElementById("result");

  let strength = 0;
  let explanation = [];

  if (password.length >= 8) {
    strength += 1;
    explanation.push("✅ Good length");
  } else {
    explanation.push("❌ Too short (use at least 8 characters)");
  }

  if (/[A-Z]/.test(password)) {
    strength += 1;
    explanation.push("✅ Contains uppercase letter");
  } else {
    explanation.push("❌ No uppercase letters");
  }

  if (/[a-z]/.test(password)) {
    strength += 1;
    explanation.push("✅ Contains lowercase letter");
  } else {
    explanation.push("❌ No lowercase letters");
  }

  if (/[0-9]/.test(password)) {
    strength += 1;
    explanation.push("✅ Contains number");
  } else {
    explanation.push("❌ No numbers");
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    strength += 1;
    explanation.push("✅ Contains special character");
  } else {
    explanation.push("❌ No special characters");
  }

  const lowerPass = password.toLowerCase();
  if (commonWords.some(word => lowerPass.includes(word))) {
    strength -= 1;
    explanation.push("⚠️ Contains a common password word");
  }

  if (containsDictionaryWord(password)) {
    strength -= 1;
    explanation.push("⚠️ Contains a dictionary word");
  }

  if (hasKeyboardPattern(password)) {
    strength -= 1;
    explanation.push("⚠️ Contains keyboard pattern");
  }

  const entropy = calculateEntropy(password);
  explanation.push(`🔐 Entropy Score: ${entropy} bits`);

  const isPwned = await checkPwned(password);
  if (isPwned) {
    strength -= 2;
    explanation.push("🚨 This password has appeared in a data breach!");
  }

  let strengthLabel = "";
  if (strength <= 2) {
    strengthLabel = "❌ Weak";
    result.style.color = "red";
  } else if (strength === 3 || strength === 4) {
    strengthLabel = "⚠️ Moderate";
    result.style.color = "orange";
  } else {
    strengthLabel = "✅ Strong";
    result.style.color = "green";
  }

  result.innerHTML = `<p>${strengthLabel}</p><ul>${explanation.map(e => `<li>${e}</li>`).join('')}</ul>`;
}

// Expose function for inline HTML call
window.analyzePassword = analyzePassword;

function togglePasswordVisibility() {
  const passwordInput = document.getElementById("password");
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
}
