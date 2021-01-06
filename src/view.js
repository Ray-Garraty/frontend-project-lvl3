import _ from 'lodash';

const addPreviewButtonHandler = (buttonElement, post) => {
  buttonElement.addEventListener('click', () => {
    const titleElement = document.querySelector('h5.modal-title');
    titleElement.textContent = post.title;
    const bodyElement = document.querySelector('div.modal-body');
    bodyElement.textContent = post.description;
    const aElement = document.querySelector('a.full-article');
    aElement.setAttribute('href', post.link);
  });
};

export default (state) => {
  const feedbackField = document.querySelector('div.feedback');
  feedbackField.className = 'feedback';
  const inputField = document.querySelector('input');
  inputField.classList.remove('is-invalid');
  if (!state.inputForm.isValid) {
    inputField.classList.add('is-invalid');
    feedbackField.classList.add('text-danger');
    feedbackField.textContent = state.inputForm.error;
  } else if (_.isEmpty(state.inputForm.error)) {
    const feedsContainer = document.querySelector('div.feeds');
    const postsContainer = document.querySelector('div.posts');
    if (state.feeds.length < 2) {
      const feedsHeader = document.createElement('h2');
      feedsHeader.textContent = 'Feeds';
      feedsContainer.appendChild(feedsHeader);
      const postsHeader = document.createElement('h2');
      postsHeader.textContent = 'Posts';
      postsContainer.appendChild(postsHeader);
      const feedsList = document.createElement('ul');
      feedsList.classList.add('list-group', 'mb-5');
      feedsContainer.appendChild(feedsList);
      const postsList = document.createElement('ul');
      postsList.classList.add('list-group');
      postsContainer.appendChild(postsList);
    }
    const feedsList = document.querySelector('ul.list-group.mb-5');
    const postsList = document.querySelectorAll('ul.list-group')[1];
    // очищаем старые фиды и посты
    const uls = document.querySelectorAll('ul.list-group');
    uls.forEach((ul) => {
      while (ul.firstChild) {
        ul.firstChild.remove();
      }
    });
    state.feeds.forEach((feed) => {
      const item = document.createElement('li');
      item.classList.add('list-group-item');
      const header = document.createElement('h3');
      header.textContent = feed.title;
      item.appendChild(header);
      const description = document.createElement('p');
      description.textContent = feed.description;
      item.appendChild(description);
      feedsList.appendChild(item);
    });
    state.posts.forEach((post) => {
      const item = document.createElement('li');
      item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
      postsList.appendChild(item);
      const link = document.createElement('a');
      link.className = 'font-weight-bold';
      link.setAttribute('href', post.link);
      link.setAttribute('data-id', post.id);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.textContent = post.title;
      item.appendChild(link);
      const button = document.createElement('button');
      button.classList.add('btn', 'btn-primary', 'btn-sm');
      button.setAttribute('type', 'button');
      button.setAttribute('data-id', post.id);
      button.setAttribute('data-toggle', 'modal');
      button.setAttribute('data-target', '#modal');
      button.textContent = 'Preview';
      addPreviewButtonHandler(button, post);
      item.appendChild(button);
      postsList.appendChild(item);
    });
    feedbackField.classList.add('text-success');
    feedbackField.textContent = 'Rss has been loaded';
    const formElement = document.querySelector('form');
    formElement.reset();
  } else {
    feedbackField.classList.add('text-danger');
    feedbackField.textContent = state.inputForm.error;
  }
};
