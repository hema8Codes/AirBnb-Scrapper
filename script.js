    // "https://www.airbnb.com/s/Wellington--New-Zealand/homes?refinement_paths%5B%5D=%2Fhomes&current_tab_id=home_tab&selected_tab_id=home_tab&place_id=ChIJy3TpSfyxOG0RcLQTomPvAAo&search_type=filter_change&screen_size=large&checkin=2019-09-02&checkout=2019-09-06&s_tag=9E4kDUxC",
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const sample = {
  guests: 1,
  bedrooms: 1,
  beds: 1,
  baths: 1,
  pesosPerNight: 350
};

let browser;

async function scrapeHomesIndexPage(url, page) {
  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    const html = await page.evaluate(() => document.body.innerHTML);
    const $ = await cheerio.load(html);

    const homes = $("[itemprop='url']")
      .map((i, element) => {
        const url = $(element).attr("content");
        //I get undefined or null at the airbnb.com in content url for some reason, so I'll just take the end part
        const splitted = url.split("rooms");
        return "https://airbnb.com/rooms" + splitted[1];
      })
      .get();
    console.log(homes);
    return homes;
  } catch (err) {
 
    console.error("Error scraping homes page");
    console.error(err);

  }
}

function returnMathes(roomText, regex) {
    const regExMatches = roomText.match(regex);
    let result = "N/A";
    if(regExMatches != null) {
        result = regExMatches[0];
    } else {
        // throw `No regex matches found for: ${regex}`;
        return '';
    }
    return result;
}

async function scrapeDescriptionPage(url, page) {
  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    const html = await page.evaluate(() => document.body.innerHTML);
    const $ = await cheerio.load(html);

    // Price Per Night
    const pricePerNight = $("#site-content > div > div:nth-child(1) > div:nth-child(3) > div > div > div > div > div:nth-child(1) > div > div > div > div > div > div > div > div > div:nth-child(1) > div > div > div > span._tyxjp1").text();
    // RoomText content
    const roomText = $("div:nth-child(7) > div > div > div:nth-child(1)").text();
    // regular experesion for guest
    const guestpattern = /\d+ guest/;
    const guestsAllowed = returnMathes(roomText, guestpattern);
    // regular experesion for bedroom
    const bedroompattern = /\d+ bedroom/;
    const bedrooms = returnMathes(roomText, bedroompattern);
    // regular experesion for bed
    const bedpattern = /\d+ bed/;
    const beds = returnMathes(roomText, bedpattern);
    // regular experesion for 
    const bathpattern = /\d+ (shared )?bath/;
    const bathroom = returnMathes(roomText, bathpattern);    
    
    return { url, guestsAllowed, bedrooms, beds, bathroom, pricePerNight};

  } catch (err) {
    console.log(url);
    console.error("error scraping description page");
    console.error(err);
  }
}

async function main() {
  browser = await puppeteer.launch({ headless: false });
  const homesIndexPage = await browser.newPage();

  //It's important to have a date selected to get prices in Airbnb
  const homes = await scrapeHomesIndexPage(
    "https://www.airbnb.co.in/s/Wellington--New-Zealand/homes?tab_id=home_tab&refinement_paths%5B%5D=%2Fhomes&flexible_trip_dates%5B%5D=december&flexible_trip_dates%5B%5D=november&flexible_trip_lengths%5B%5D=weekend_trip&date_picker_type=calendar&query=Wellington%2C%20New%20Zealand&place_id=ChIJy3TpSfyxOG0RcLQTomPvAAo&source=structured_search_input_header&search_type=autocomplete_click" ,
    homesIndexPage
  );
  
  const descriptionPage = await browser.newPage();

  for (var i = 0; i < homes.length; i++) {
    let result = await scrapeDescriptionPage(homes[i], descriptionPage);
    console.log(result);
  }
 
}

main();