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
  databaseURL:
    "https://tanabata-wishes-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tanabata-wishes",
  storageBucket: "tanabata-wishes.firebasestorage.app",
  messagingSenderId: "605416394989",
  appId: "1:605416394989:web:f312df5887bd38e656bce4"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const wishesRef = ref(database, "wishes");

let wishes = [];
let currentIndex = 0;

const form = document.getElementById("wishForm");
const nameInput = document.getElementById("name");
const categoryInput = document.getElementById("grade");
const wishInput = document.getElementById("wish");

const card = document.getElementById("wishCard");
const cardName = document.getElementById("cardName");
const cardGrade = document.getElementById("cardGrade");
const cardWish = document.getElementById("cardWish");

const likeButton = document.getElementById("likeButton");
const likeCount = document.getElementById("likeCount");

const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");

function showWish(index) {
  if (wishes.length === 0) {
    cardName.textContent = "七夕";
    cardGrade.textContent = "願いごと";
    cardWish.textContent = "最初の願いごとを書いてみよう";
    likeCount.textContent = "0";

    if (likeButton) {
      likeButton.disabled = true;
    }

    return;
  }

  if (index < 0) {
    currentIndex = wishes.length - 1;
  } else if (index >= wishes.length) {
    currentIndex = 0;
  } else {
    currentIndex = index;
  }

  const wish = wishes[currentIndex];

  cardName.textContent = wish.name || "匿名";
  cardGrade.textContent = wish.category || wish.grade || "その他";
  cardWish.textContent = wish.wish || "";
  likeCount.textContent = wish.likes || 0;

  if (likeButton) {
    likeButton.disabled = false;
  }

  if (card) {
    card.classList.remove("card-change");

    void card.offsetWidth;

    card.classList.add("card-change");
  }
}

onValue(wishesRef, (snapshot) => {
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

  wishes.sort((a, b) => {
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  if (currentIndex >= wishes.length) {
    currentIndex = 0;
  }

  showWish(currentIndex);
});

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const category = categoryInput.value;
    const wish = wishInput.value.trim();

    if (!name || !category || !wish) {
      alert("すべて入力してください");
      return;
    }

    try {
      await push(wishesRef, {
        name,
        category,
        wish,
        likes: 0,
        createdAt: Date.now()
      });

      form.reset();

      alert("願いごとを短冊に込めました 🎋");
    } catch (error) {
      console.error(error);

      alert(
        "願いごとの投稿に失敗しました。もう一度試してください。"
      );
    }
  });
}

if (prevButton) {
  prevButton.addEventListener("click", () => {
    if (wishes.length === 0) {
      return;
    }

    currentIndex--;

    if (currentIndex < 0) {
      currentIndex = wishes.length - 1;
    }

    showWish(currentIndex);
  });
}

if (nextButton) {
  nextButton.addEventListener("click", () => {
    if (wishes.length === 0) {
      return;
    }

    currentIndex++;

    if (currentIndex >= wishes.length) {
      currentIndex = 0;
    }

    showWish(currentIndex);
  });
}

if (likeButton) {
  likeButton.addEventListener("click", async () => {
    if (wishes.length === 0) {
      return;
    }

    const wish = wishes[currentIndex];

    if (!wish || !wish.id) {
      return;
    }

    const likeRef = ref(
      database,
      `wishes/${wish.id}/likes`
    );

    try {
      await runTransaction(likeRef, (currentLikes) => {
        return (currentLikes || 0) + 1;
      });
    } catch (error) {
      console.error(error);

      alert("いいねに失敗しました");
    }
  });
}

let touchStartX = 0;
let touchEndX = 0;

if (card) {
  card.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].screenX;
    },
    {
      passive: true
    }
  );

  card.addEventListener(
    "touchend",
    (event) => {
      touchEndX = event.changedTouches[0].screenX;

      const swipeDistance =
        touchEndX - touchStartX;

      if (Math.abs(swipeDistance) < 50) {
        return;
      }

      if (swipeDistance < 0) {
        currentIndex++;

        if (currentIndex >= wishes.length) {
          currentIndex = 0;
        }
      } else {
        currentIndex--;

        if (currentIndex < 0) {
          currentIndex = wishes.length - 1;
        }
      }

      showWish(currentIndex);
    },
    {
      passive: true
    }
  );
}

showWish(currentIndex);
