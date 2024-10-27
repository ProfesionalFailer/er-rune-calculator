let runeData = {}; // To hold the data fetched from runes.json
let totalRunes = 0; // To hold the total runes count

// Format a string for use as an ID or key
function formatString(input) {
	return input
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/^-+|-+$/g, "");
}

// Fetch rune data from a JSON file and initialize the UI
async function fetchRuneData(jsFile) {
	try {
		const response = await fetch(jsFile);
		runeData = await response.json();
		loadAllStoredRunes(); // Load existing rune quantities from local storage
		generateAllRunes(); // Generate rune inputs on the page
		calculateTotalRunes(); // Calculate and display total runes once after fetching
	} catch (error) {
		console.error("Error fetching rune data:", error);
	}
}

// Load stored values from Local Storage into the runeData
function loadAllStoredRunes() {
	for (const [category, levels] of Object.entries(runeData)) {
		for (const [level, data] of Object.entries(levels)) {
			data.quantity = loadStoredRune(data.name); // Set the quantity directly in runeData
		}
	}
}

// Get the stored quantity of a rune from local storage
function loadStoredRune(name) {
	const storedQuantity = localStorage.getItem(formatString(name));
	return storedQuantity !== null ? parseInt(storedQuantity, 10) : 0;
}

// Save the quantity of a rune to local storage
function saveStoredRune(name, quantity) {
	localStorage.setItem(formatString(name), quantity >= 0 ? quantity : 0);
}

// Generate all rune inputs based on runeData
function generateAllRunes() {
	const categoriesList = Object.entries(runeData)
		.reduce((accumulator, [category, levels]) => {
			return accumulator + generateCategory(category, levels);
		}, "")
		.trim();

	document.getElementById("runes-div").innerHTML = categoriesList; // Render runes in the DOM
}

// Generate the HTML for a rune category
function generateCategory(category, levels) {
	const runesList = Object.entries(levels).reduce((accumulator, [level, data]) => {
		return accumulator + "\n" + generateRune(category, level, data);
	}, "");

	return `<div class="rune-category" id="${formatString(category)}">
                <div class="category-header" onclick="showCategory('${formatString(category)}')">
                    ${category}
			        <span>+</span>
                </div>

                <div class="category-div" style="display: none;">
                    ${runesList}
                </div>
            </div>`;
}

// Generate the HTML for a single rune
function generateRune(category, level, data) {
	const safeCategory = category.replace(/'/g, "\\'");
	const safeLevel = level.replace(/'/g, "\\'");
	const styled = `color: ${data.quantity > 0 ? "red" : "black"}; font-weight: ${
		data.quantity > 0 ? "bold" : "normal"
	};`;

	return `<div class="rune-level" id="${formatString(data.name)}">
				<label>${data.name}: ${data.value}</label>
				<button class="decrement-btn" onclick="updateQuantity('${safeCategory}', '${safeLevel}', -1)">-</button>
				<span class="quantity" style="${styled}">
					${data.quantity}
				</span>
				<button class="increment-btn" onclick="updateQuantity('${safeCategory}', '${safeLevel}', 1)">+</button>
			</div>`;
}

// Toggle visibility of a rune category
function showCategory(category) {
	const categoryDiv = document.getElementById(category).getElementsByClassName("category-div")[0];
	const isExpanded = categoryDiv.style.display === "block";

	categoryDiv.style.display = isExpanded ? "none" : "block"; // Show/hide category
	document.getElementById(category).getElementsByTagName("span")[0].innerText = isExpanded ? "+" : "-"; // Update toggle icon
}

// Update the quantity of a specific rune
function updateQuantity(category, level, change) {
	const data = runeData[category][level];
	const name = formatString(runeData[category][level].name);
	const quantityText = document.getElementById(name).getElementsByClassName("quantity")[0];
	let currentQuantity = parseInt(quantityText.innerText, 10) || 0;

	if (currentQuantity + change >= 0) currentQuantity += change; // Prevent negative quantities
	quantityText.innerText = currentQuantity; // Update displayed quantity

	updateQuantityColor(quantityText, currentQuantity); // Update color based on quantity

	runeData[category][level].quantity = currentQuantity; // Update in internal data structure
	saveStoredRune(name, currentQuantity); // Save individual rune quantity

	calculateTotalRunes(); // Recalculate total runes
}

// Update the display style of quantity text based on its value
function updateQuantityColor(quantityText, quantity) {
	quantityText.style.color = quantity > 0 ? "red" : "black";
	quantityText.style.fontWeight = quantity > 0 ? "bold" : "normal";
}

// Calculate total runes based on stored values
function calculateTotalRunes() {
	totalRunes = 0; // Reset total runes

	for (const levels of Object.values(runeData)) {
		for (const { quantity, value, _ } of Object.values(levels)) {
			totalRunes += quantity * value; // Sum up total runes
		}
	}

	document.getElementById("result").innerText = `Total Runes: ${totalRunes}`; // Update total display
}

// Reset all rune quantities to 0 and update display
function resetAllRunes() {
	for (const levels of Object.values(runeData)) {
		for (const data of Object.values(levels)) {
			data.quantity = 0; // Reset quantity
			saveStoredRune(data.name, 0); // Save reset quantity to localStorage

			const quantityText = document.getElementById(formatString(data.name)).getElementsByClassName("quantity")[0];
			quantityText.innerText = "0"; // Update displayed quantity
			updateQuantityColor(quantityText, 0); // Update display style
		}
	}
	calculateTotalRunes(); // Update total runes once after reset
}

fetchRuneData("./assets/runes.json"); // Initialize data fetching
