import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  push,
  onValue,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAwDf9GT864-kqW4J5RtaCE5mlQgmYJS8g",
  authDomain: "tanabata-wishes.firebaseapp.com",
  databaseURL: "https://tanabata-wishes-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tanabata-wishes",
  storageBucket: "tanabata-wishes.firebasestorage.app",
  messagingSenderId: "605416394989",
  appId: "1:605416394989:web:f312df5887bd38e656bce4"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const wishesRef = ref(database, "wishes");

const carousel = document.getElementById("carousel");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");

const form = document.getElementById("wishForm");
const nameInput = document.getElementById("name");
const categoryInput = document.getElementById("grade");
const wishInput = document.getElementById("wish");
const status = document.getElementById("status");
const totalLikes = document.getElementById("totalLikes");

const sortButtons = document.querySelectorAll(".sort button");

let wishes = [];
let currentIndex = 0;
let currentSort = "new";

function getSortedWishes() {
  const sorted = [...wishes];

  if (currentSort === "likes") {
    sorted.sort((a, b) => {
      return (b.likes || 0) - (a.likes || 0);
    });
  } else {
    sorted.sort((a, b) => {
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }

  return sorted;
}

function updateTotalLikes() {
  const total = wishes.reduce((sum, wish) => {
    return sum + (wish.likes || 0);
  }, 0);

  totalLikes.textContent = total;
}

function renderWish() {
  const sortedWishes = getSortedWishes();

  if (sortedWishes.length === 0) {
    carousel.innerHTML = `
      <div class="loading">
        まだ願いごとはありません。<br>
        最初の願いごとを書いてみよう 🎋
      </div>
    `;

    return;
  }

  if (currentIndex < 0) {
    currentIndex = sortedWishes.length - 1;
  }

  if (currentIndex >= sortedWishes.length) {
    currentIndex = 0;
  }

  const wish = sortedWishes[currentIndex];

  carousel.innerHTML = `
    <article class="wish-card">
      <div class="hole"></div>

      <h3>${escapeHTML(wish.name || "匿名")}</h3>

      <span class="grade">
        ${escapeHTML(wish.category || "その他")}
      </span>

      <p class="wish-text">
        ${escapeHTML(wish.wish || "")}
      </p>

      <button
        class="like-button"
        id="currentLikeButton"
        type="button"
      >
        ♥ <span>${wish.likes || 0}</span>
      </button>
    </article>
  `;

  const likeButton = document.getElementById("currentLikeButton");

  likeButton.addEventListener("click", async () => {
    const likeRef = ref(
      database,
      `wishes/${wish.id}/likes`
    );

    try {
      await runTransaction(likeRef, currentLikes => {
        return (currentLikes || 0) + 1;
      });
    } catch (error) {
      console.error(error);
      alert("いいねに失敗しました");
    }
  });
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

onValue(
  wishesRef,
  snapshot => {
    const data = snapshot.val();

    wishes = [];

    if (data) {
      Object.entries(data).forEach(([id, wish]) => {
        wishes.push({
          id,
          ...wish
        });
      });
    }

    const sortedWishes = getSortedWishes();

    if (currentIndex >= sortedWishes.length) {
      currentIndex = 0;
    }

    updateTotalLikes();
    renderWish();

    status.textContent = "";
  },
  error => {
    console.error(error);

    carousel.innerHTML = `
      <div class="loading">
        Firebaseへの接続に失敗しました。<br>
        ${escapeHTML(error.message)}
      </div>
    `;

    status.textContent =
      "読み込みに失敗しました：" + error.message;
  }
);

form.addEventListener("submit", async event => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const category = categoryInput.value;
  const wish = wishInput.value.trim();

  if (!name || !category || !wish) {
    status.textContent = "すべて入力してください。";
    return;
  }

  status.textContent = "願いごとを届けています…";

  try {
    await push(wishesRef, {
      name,
      category,
      wish,
      likes: 0,
      createdAt: Date.now()
    });

    form.reset();

    status.textContent =
      "願いごとを短冊に込めました 🎋";

    currentIndex = 0;
  } catch (error) {
    console.error(error);

    status.textContent =
      "投稿できませんでした：" + error.message;
  }
});

prevButton.addEventListener("click", () => {
  const sortedWishes = getSortedWishes();

  if (sortedWishes.length === 0) {
    return;
  }

  currentIndex--;

  if (currentIndex < 0) {
    currentIndex = sortedWishes.length - 1;
  }

  renderWish();
});

nextButton.addEventListener("click", () => {
  const sortedWishes = getSortedWishes();

  if (sortedWishes.length === 0) {
    return;
  }

  currentIndex++;

  if (currentIndex >= sortedWishes.length) {
    currentIndex = 0;
  }

  renderWish();
});

sortButtons.forEach(button => {
  button.addEventListener("click", () => {
    sortButtons.forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    currentSort = button.dataset.sort;
    currentIndex = 0;

    renderWish();
  });
});

let touchStartX = 0;
let touchEndX = 0;

carousel.addEventListener(
  "touchstart",
  event => {
    touchStartX =
      event.changedTouches[0].screenX;
  },
  {
    passive: true
  }
);

carousel.addEventListener(
  "touchend",
  event => {
    touchEndX =
      event.changedTouches[0].screenX;

    const distance =
      touchEndX - touchStartX;

    if (Math.abs(distance) < 50) {
      return;
    }

    const sortedWishes = getSortedWishes();

    if (sortedWishes.length === 0) {
      return;
    }

    if (distance < 0) {
      currentIndex++;

      if (currentIndex >= sortedWishes.length) {
        currentIndex = 0;
      }
    } else {
      currentIndex--;

      if (currentIndex < 0) {
        currentIndex = sortedWishes.length - 1;
      }
    }

    renderWish();
  },
  {
    passive: true
  }
);
