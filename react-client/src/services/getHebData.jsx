import $ from 'jquery';

const getHebData = (searchTerm, cb) => {
  $.ajax({
    method: 'POST',
    url: '/api/heb',
    data: { query: searchTerm }
  })
    .then(results => {
      if (cb) {
        cb(results);
      }
    })
    .catch(err => {
      console.log(err);
    });
};

export default getHebData;