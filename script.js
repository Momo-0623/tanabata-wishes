import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import {
  getDatabase,
  ref,
  push,
  onValue,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


const firebaseConfig = {

  apiKey:
    "AIzaSyAwDf9GT864-kqW4J5RtaCE5mlQgmYJS8g",

  authDomain:
    "tanabata-wishes.firebaseapp.com",

  databaseURL:
    "https://tanabata-wishes-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId:
    "tanabata-wishes",

  storageBucket:
    "tanabata-wishes.firebasestorage.app",

  messagingSenderId:
    "605416394989",

  appId:
    "1:605416394989:web:f312df5887bd38e656bce4"

};


const app =
  initializeApp(firebaseConfig);


const database =
  getDatabase(app);


const wishesRef =
  ref(database, "wishes");


const carousel =
  document.getElementById("carousel");


const prevButton =
  document.getElementById("prev");


const nextButton =
  document.getElementById("next");


const form =
  document.getElementById("wishForm");


const nameInput =
  document.getElementById("name");


const categoryInput =
  document.getElementById("grade");


const wishInput =
  document.getElementById("wish");


const status =
  document.getElementById("status");


const totalLikes =
  document.getElementById("totalLikes");


const sortButtons =
  document.querySelectorAll(
    "[data-sort]"
  );


let wishes = [];


let currentIndex = 0;


let currentSort = "new";


function getLikedKey(id) {

  return `tanabata_liked_${id}`;

}


function hasLiked(id) {

  return (
    localStorage.getItem(
      getLikedKey(id)
    ) === "true"
  );

}


function saveLiked(id) {

  localStorage.setItem(
    getLikedKey(id),
    "true"
  );

}


function sortedWishes() {

  const copied =
    [...wishes];


  if (currentSort === "likes") {

    copied.sort((a, b) => {

      const likeDifference =
        (b.likes || 0) -
        (a.likes || 0);


      if (likeDifference !== 0) {

        return likeDifference;

      }


      return (
        (b.createdAt || 0) -
        (a.createdAt || 0)
      );

    });

  } else {

    copied.sort((a, b) => {

      return (
        (b.createdAt || 0) -
        (a.createdAt || 0)
      );

    });

  }


  return copied;

}


function updateTotalLikes() {

  const total =
    wishes.reduce(
      (sum, wish) => {

        return (
          sum +
          Number(wish.likes || 0)
        );

      },
      0
    );


  totalLikes.textContent =
    total;

}


function createWishCard(wish) {

  const card =
    document.createElement("article");


  card.className =
    "wish-card";


  card.dataset.id =
    wish.id;


  const name =
    document.createElement("h3");


  name.textContent =
    wish.name || "匿名";


  const grade =
    document.createElement("div");


  grade.className =
    "grade";


  grade.textContent =
    wish.category ||
    wish.grade ||
    "その他";


  const wishText =
    document.createElement("div");


  wishText.className =
    "wish-text";


  /*
    改行や余分な空白を除去
    縦書きで変な隙間ができるのを防ぐ
  */

  wishText.textContent =
    String(wish.wish || "")
      .replace(/\r?\n/g, "")
      .replace(/\s+/g, " ")
      .trim();


  const likeButton =
    document.createElement("button");


  likeButton.className =
    "like";


  likeButton.type =
    "button";


  function updateLikeButton() {

    likeButton.textContent =
      `♥ ${wish.likes || 0}`;


    if (hasLiked(wish.id)) {

      likeButton.classList.add(
        "liked"
      );


      likeButton.disabled =
        true;

    } else {

      likeButton.classList.remove(
        "liked"
      );


      likeButton.disabled =
        false;

    }

  }


  updateLikeButton();


  likeButton.addEventListener(
    "click",
    async () => {

      if (hasLiked(wish.id)) {

        return;

      }


      likeButton.disabled =
        true;


      const likeRef =
        ref(
          database,
          `wishes/${wish.id}/likes`
        );


      try {

        await runTransaction(
          likeRef,
          currentLikes => {

            return (
              Number(currentLikes || 0) +
              1
            );

          }
        );


        saveLiked(wish.id);


        likeButton.classList.add(
          "liked"
        );


      } catch (error) {

        console.error(error);


        likeButton.disabled =
          false;


        alert(
          "いいねに失敗しました"
        );

      }

    }
  );


  card.appendChild(name);


  card.appendChild(grade);


  card.appendChild(wishText);


  card.appendChild(likeButton);


  return card;

}


function renderWishes() {

  const list =
    sortedWishes();


  carousel.innerHTML =
    "";


  if (list.length === 0) {

    carousel.innerHTML = `
      <div class="empty">
        まだ願いごとはありません。<br>
        最初の願いを書いてみよう 🎋
      </div>
    `;


    currentIndex =
      0;


    return;

  }


  if (currentIndex >= list.length) {

    currentIndex =
      0;

  }


  list.forEach(wish => {

    const card =
      createWishCard(wish);


    carousel.appendChild(card);

  });


  requestAnimationFrame(() => {

    scrollToCurrent(false);

  });

}


function getCards() {

  return [
    ...carousel.querySelectorAll(
      ".wish-card"
    )
  ];

}


function scrollToCurrent(smooth = true) {

  const cards =
    getCards();


  if (cards.length === 0) {

    return;

  }


  if (currentIndex < 0) {

    currentIndex =
      cards.length - 1;

  }


  if (
    currentIndex >= cards.length
  ) {

    currentIndex =
      0;

  }


  cards[currentIndex].scrollIntoView({

    behavior:
      smooth
        ? "smooth"
        : "auto",

    inline:
      "center",

    block:
      "nearest"

  });

}


function goNext() {

  const cards =
    getCards();


  if (cards.length === 0) {

    return;

  }


  currentIndex++;


  if (
    currentIndex >= cards.length
  ) {

    currentIndex =
      0;

  }


  scrollToCurrent();

}


function goPrev() {

  const cards =
    getCards();


  if (cards.length === 0) {

    return;

  }


  currentIndex--;


  if (currentIndex < 0) {

    currentIndex =
      cards.length - 1;

  }


  scrollToCurrent();

}


nextButton.addEventListener(
  "click",
  goNext
);


prevButton.addEventListener(
  "click",
  goPrev
);


let scrollTimer = null;


carousel.addEventListener(
  "scroll",
  () => {

    clearTimeout(scrollTimer);


    scrollTimer =
      setTimeout(() => {

        const cards =
          getCards();


        if (cards.length === 0) {

          return;

        }


        const carouselCenter =
          carousel.scrollLeft +
          carousel.clientWidth / 2;


        let nearestIndex =
          0;


        let nearestDistance =
          Infinity;


        cards.forEach(
          (card, index) => {

            const cardCenter =
              card.offsetLeft +
              card.offsetWidth / 2;


            const distance =
              Math.abs(
                carouselCenter -
                cardCenter
              );


            if (
              distance <
              nearestDistance
            ) {

              nearestDistance =
                distance;


              nearestIndex =
                index;

            }

          }
        );


        currentIndex =
          nearestIndex;

      }, 100);

  },
  {
    passive: true
  }
);


sortButtons.forEach(button => {

  button.addEventListener(
    "click",
    () => {

      sortButtons.forEach(
        item => {

          item.classList.remove(
            "active"
          );

        }
      );


      button.classList.add(
        "active"
      );


      currentSort =
        button.dataset.sort;


      currentIndex =
        0;


      renderWishes();

    }
  );

});


onValue(
  wishesRef,
  snapshot => {

    const data =
      snapshot.val();


    wishes =
      [];


    if (data) {

      Object.entries(data)
        .forEach(
          ([id, wish]) => {

            wishes.push({

              id,

              ...wish

            });

          }
        );

    }


    updateTotalLikes();


    renderWishes();

  },
  error => {

    console.error(error);


    carousel.innerHTML = `
      <div class="empty">
        Firebaseへの接続に失敗しました。<br>
        ${error.message}
      </div>
    `;

  }
);


form.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const name =
      nameInput.value.trim();


    const category =
      categoryInput.value;


    const wish =
      wishInput.value.trim();


    if (
      !name ||
      !category ||
      !wish
    ) {

      status.textContent =
        "すべて入力してください。";


      return;

    }


    const submitButton =
      form.querySelector(
        'button[type="submit"]'
      );


    submitButton.disabled =
      true;


    status.textContent =
      "願いごとを届けています…";


    try {

      await push(
        wishesRef,
        {

          name,

          category,

          wish,

          likes: 0,

          createdAt:
            Date.now()

        }
      );


      form.reset();


      status.textContent =
        "願いごとを短冊に込めました 🎋";


    } catch (error) {

      console.error(error);


      status.textContent =
        `投稿できませんでした：${error.message}`;

    } finally {

      submitButton.disabled =
        false;

    }

  }
);
