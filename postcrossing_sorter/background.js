// This function runs when the user clicks the extension's icon in the toolbar.
function sortPostcrossingTabs() {
  // 1. Get all tabs in the current window.
  browser.tabs.query({ currentWindow: true }).then((tabs) => {
    // 2. Filter to get ONLY the Postcrossing postcard tabs.
    let postcardTabs = tabs.filter(tab => tab.url && tab.url.includes("postcrossing.com/postcards/"));

    // If there are no postcard tabs, do nothing.
    if (postcardTabs.length === 0) {
      console.log("No Postcrossing tabs found to sort.");
      return;
    }

    // 3. Sort the tabs. This is the core logic.
    postcardTabs.sort((tabA, tabB) => {
      // Extract the number part from the URL (e.g., 'CL-34269' -> '34269')
      const numA = parseInt(tabA.url.split('-')[1]);
      const numB = parseInt(tabB.url.split('-')[1]);
      return numA - numB; // Standard numeric sort
    });

    // 4. Move the sorted tabs to the front of the browser window.
    // We get the IDs of the sorted tabs in the new order.
    const tabIds = postcardTabs.map(tab => tab.id);

    // The move command takes an array of tab IDs and an index to move them to.
    // We move them all to the start of the tab bar (index: 0).
    browser.tabs.move(tabIds, { index: 0 });

    console.log("Tabs sorted!");
  });
}

// Tell Firefox to run our sortPostcrossingTabs function when the icon is clicked.
browser.browserAction.onClicked.addListener(sortPostcrossingTabs);