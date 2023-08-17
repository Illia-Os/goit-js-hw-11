// import './css/styles.css';
import PhotoApiService from './photo-service';
import LoadMoreBtn from './load-more-bnt';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

const photosApiService = new PhotoApiService();

const loadMoreBtn = new LoadMoreBtn({
  selector: '[data-action="load-more"]',
  hidden: true,
});

const refs = {
  searchForm: document.querySelector('#search-form'),
  gallery: document.querySelector('.gallery'),
};

const lightbox = new SimpleLightbox('.gallery a', {
  scrollZoom: false,
});

refs.searchForm.addEventListener('submit', onSearch);
loadMoreBtn.refs.button.addEventListener('click', onLoadMoreBtnClick);

async function onSearch(e) {
  e.preventDefault();

  if (
    photosApiService.query ===
      e.currentTarget.elements.searchQuery.value.trim() &&
    !photosApiService.query
  ) {
    Notify.failure('Вибачте, але ви повинні ввести значення');
    return;
  }

  if (
    photosApiService.query === e.currentTarget.elements.searchQuery.value.trim()
  ) {
    return;
  }

  clearPhotosContainer();

  photosApiService.query = e.currentTarget.elements.searchQuery.value.trim();

  if (!photosApiService.query) {
    Notify.failure('Вибачте, але ви повинні ввести значення');
    loadMoreBtn.hide();
    return;
  }

  photosApiService.resetPage();
  photosApiService.resetTotalLoadedPhoto();
  photosApiService.resettotalHits();
  loadMoreBtn.hide();

  try {
    const photosResponse = await photosApiService.fetchPhotos();
    const photoArray = photosResponse.hits;

    if (photoArray.length === 0) {
      Notify.failure(
        'Вибачте, немає зображень, які відповідають вашому пошуковому запиту. Будь ласка спробуйте ще раз.'
      );
      return;
    }

    Notify.success(`Hooray! We found ${photosResponse.totalHits} images.`);

    renderPhotos(photoArray);

    if (photosApiService.totalLoadedPhoto >= photosApiService.totalHits) {
      Notify.failure('Вибачте, але ви досягли кінця результатів пошуку.');
      return;
    }

    loadMoreBtn.show();
  } catch (err) {
    console.log(err);
  }
}

async function onLoadMoreBtnClick() {
  try {
    const photosResponse = await photosApiService.fetchPhotos();
    const photoArray = await photosResponse.hits;

    renderPhotos(photoArray);
    if (photosApiService.totalLoadedPhoto >= photosApiService.totalHits) {
      Notify.failure(
        "Вибачте, але ви досягли кінця результатів пошуку."
      );
      loadMoreBtn.hide();
      return;
    }
  } catch (err) {
    console.log(err);
  }
}

function renderPhotos(photos) {
  const template = photos
    .map(
      ({
        webformatURL,
        tags,
        likes,
        views,
        comments,
        downloads,
        largeImageURL,
      }) => `<div class="photo-card">
      <div class='thumb'>
      <a class="gallery__item link" href="${largeImageURL}">
      <img class="gallery__image" src="${webformatURL}" alt="${tags}" loading="lazy" />
      </a>
      </div>
      <div class="info">
        <p class="info-item">
          <b>Likes</b> <span>${likes}</span>
        </p>
        <p class="info-item">
          <b>Views</b> <span>${views}</span>
        </p>
        <p class="info-item">
          <b>Comments</b> <span>${comments}</span>
        </p>
        <p class="info-item">
          <b>Downloads</b> <span>${downloads}</span>
        </p>
      </div>
    </div>`
    )
    .join('');

  refs.gallery.insertAdjacentHTML('beforeEnd', template);
  lightbox.refresh();

  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

function clearPhotosContainer() {
  refs.gallery.innerHTML = '';
}