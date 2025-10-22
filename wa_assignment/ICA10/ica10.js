const newQuoteBtn = document.querySelector('#js-new-quote');

// run getQuote when the button is clicked
newQuoteBtn.addEventListener('click', getQuote);

// api endpoint
const endpoint = 'https://trivia.cyberwisp.com/getrandomchristmasquestion';

// fetch a quote and handle success/error
async function getQuote() {
  console.log('Fetching a new quote…');
  try {
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    console.log('Success:', data);
    displayQuote(data.question);
  } catch (err) {
    console.error('Error:', err);
    alert('Sorry, there was a problem getting a new quote.');
  }
}

// put the text into #js-quote-text
function displayQuote(text) {
  const quoteEl = document.querySelector('#js-quote-text');
  quoteEl.textContent = text || 'No quote found.';
}

// show a quote on refresh
document.addEventListener('DOMContentLoaded', getQuote);