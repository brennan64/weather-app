var weatherClient = new WeatherClient();

async function handleSearchClick() {
  const searchQuery = $('input[name="search-query"]').val();
  if (searchQuery) return await weatherClient.search(searchQuery);
  return alert("Please enter a search term.");
}

$("button.search-btn").click(handleSearchClick);
