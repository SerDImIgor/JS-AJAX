class CustomerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CustomerError';
    }
}
async function getData(url) {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
    });
    if (!response.ok) {
        throw new CustomerError(`Server return bad response code (${response.status} ${response.statusText}) `);
    }
    return response.json();
}

async function loadCountriesData() {
    const countries = await getData('https://restcountries.com/v3.1/all?fields=name&fields=cca3');
    return countries.reduce((result, country) => {
        result[country.name.common] = country.cca3;
        return result;
    }, []);
}
const contentCountry = document.getElementById('content_country');
const output = document.getElementById('output');
const searchInput = document.getElementById('search');
const searchWrapper = document.querySelector('.wrapper');
const resultsWrapper = document.querySelector('.results');

async function loadDetailCountry(countryCode) {
    const country = await getData(
        `https://restcountries.com/v3.1/alpha/${countryCode}?fields=cca3&fields=capital&fields=region&fields=area&fields=population&fields=flags&fields=name`
    );
    const countryInfo = {};
    countryInfo.flag = country.flags.png;
    countryInfo.name = country.name.common;
    countryInfo.region = country.region;
    countryInfo.area = country.area;
    countryInfo.population = country.population;
    countryInfo.capital = country.capital.reduce((result, capital) => {
        result.push(capital);
        return result;
    }, []);
    return countryInfo;
}
function printInformationCountry(country) {
    const nameCountry = document.getElementById('name_country');
    nameCountry.innerHTML = `<h5>${country.name}</h5>`;

    const flagCountry = document.getElementById('flag_country');
    flagCountry.src = country.flag;

    const capitalCountry = document.getElementById('capital_country');
    capitalCountry.innerHTML = `<h5>${country.capital.join(';')}</h5>`;

    const areaCountry = document.getElementById('area_country');
    areaCountry.innerHTML = `<h5>${country.area}</h5>`;

    const populationCountry = document.getElementById('population_country');
    populationCountry.innerHTML = `<h5>${country.population}</h5>`;

    const regionCountry = document.getElementById('region_country');
    regionCountry.innerHTML = `<h5>${country.region}</h5>`;
    contentCountry.style.visibility = 'visible';
}
function printHistorySearch(arrCountry) {
    for (let i = 0; i < arrCountry.length; i++) {
        const country = arrCountry[i];
        const nameCountry = document.getElementById(`historycolumn_name_country_${i + 1}`);
        nameCountry.innerHTML = `<h5>${country.name}</h5>`;

        const flagCountry = document.getElementById(`historycolumn_flag_country_${i + 1}`);
        flagCountry.src = country.flag;
    }
    for (let i = 1; i < 4; i++) {
        const rowHistory = document.getElementById(`history_row_${i}`);
        if (i <= arrCountry.length) {
            rowHistory.style.visibility = 'visible';
        } else {
            rowHistory.style.visibility = 'hidden';
        }
    }
}
function setComponentStatus(flag) {
    if (flag) {
        searchInput.disabled = true;
        output.innerHTML = 'Loading…';
        contentCountry.style.visibility = 'visible';
    } else {
        searchInput.disabled = false;
        output.innerHTML = '';
        contentCountry.style.visibility = 'hidden';
    }
}
async function loadDataForCountry(countryCode) {
    searchInput.disabled = true;
    output.innerHTML = 'Loading…';
    contentCountry.style.visibility = 'hidden';
    try {
        const countryInfo = await loadDetailCountry(countryCode);
        localStorage.setItem(countryCode, JSON.stringify(countryInfo));
        printInformationCountry(countryInfo);
    } catch (err) {
        if (err instanceof CustomerError) {
            output.innerHTML = `<p style="color:red"> findPath : ${err.message} </p>`;
        } else {
            output.innerHTML = `<p style="color:red">It seems that you do not have an internet connection or the server is not available ${err.message}</p>`;
        }
        searchInput.disabled = false;
        contentCountry.style.visibility = 'hidden';
        return;
    }
    searchInput.disabled = false;
    output.innerHTML = '';
    contentCountry.style.visibility = 'visible';
}
function uploadLastSaveCountryes() {
    const lastUploadKeyCountryCodes = localStorage.getItem('last_upload_country');
    if (lastUploadKeyCountryCodes !== null) {
        const arrCodes = JSON.parse(lastUploadKeyCountryCodes);
        const lastUploadCountry = [];
        for (let i = 0; i < arrCodes.length; i++) {
            const cn = localStorage.getItem(arrCodes[i]);
            if (cn !== null) {
                lastUploadCountry.push(JSON.parse(cn));
            }
        }
        printHistorySearch(lastUploadCountry);
    } else {
        printHistorySearch([]);
    }
}
function updateUploadCountryes(countryCode) {
    const lastUploadKeyCountryCodes = localStorage.getItem('last_upload_country');
    if (lastUploadKeyCountryCodes !== null) {
        const codeArray = JSON.parse(lastUploadKeyCountryCodes);
        if (!codeArray.includes(countryCode)) {
            codeArray.unshift(countryCode);
            localStorage.setItem('last_upload_country', JSON.stringify(codeArray.slice(0, 3)));
        } else {
            const arr = codeArray.filter((item) => item !== countryCode);
            arr.unshift(countryCode);
            localStorage.setItem('last_upload_country', JSON.stringify(arr));
        }
    } else {
        const codeArray = [countryCode];
        localStorage.setItem('last_upload_country', JSON.stringify(codeArray));
    }
}

(async () => {
    setComponentStatus(true);
    let arrNametoCCA3 = [];
    try {
        arrNametoCCA3 = await loadCountriesData();
    } catch (err) {
        if (err instanceof CustomerError) {
            output.innerHTML = `<p style="color:red"> loadCountries : ${err.message} </p>`;
        } else {
            output.innerHTML = `<p style="color:red">It seems that you do not have an internet connection or the server is not available (${err.message})</p>`;
        }
        searchInput.disabled = false;
        contentCountry.style.visibility = 'hidden';
        return;
    }
    setComponentStatus(false);
    // load history for last country
    uploadLastSaveCountryes();
    // key event
    searchInput.addEventListener('keyup', () => {
        let results = [];
        const input = searchInput.value;
        const searchable = Object.keys(arrNametoCCA3);
        if (input.length) {
            results = searchable.filter((item) => {
                return item.toLowerCase().includes(input.toLowerCase());
            });
        }
        renderResults(results);
        contentCountry.style.visibility = 'hidden';
    });
    async function serverRequest(countryCode) {
        try {
            await loadDataForCountry(countryCode);
            updateUploadCountryes(countryCode);
            uploadLastSaveCountryes();
        } catch (err) {
            if (err instanceof CustomerError) {
                output.innerHTML = `<p style="color:red"> loadCountries : ${err.message} <p>`;
            } else {
                output.innerHTML = `<p style="color:red">It seems that you do not have an internet connection or the server is not available ${err.message}</p>`;
            }
        }
    }
    // choose country
    resultsWrapper.addEventListener('click', (e) => {
        e = e || window.event;
        const text = 'textContent' in document ? 'textContent' : 'innerText';
        searchWrapper.classList.remove('show');
        if (arrNametoCCA3.hasOwnProperty(e.target[text])) {
            const countryCode = arrNametoCCA3[e.target[text]];
            const record = localStorage.getItem(countryCode);
            searchInput.value = '';
            if (record === null) {
                serverRequest(countryCode);
            } else {
                printInformationCountry(JSON.parse(record));
                updateUploadCountryes(countryCode);
                uploadLastSaveCountryes();
            }
        } else {
            output.innerHTML = `<h4>Some countries do not yet exist on our list(${e.target[text]})</h4>`;
        }
    });
    // show 10 element
    function renderResults(results) {
        if (!results.length) {
            searchWrapper.classList.remove('show');
            return;
        }
        const contentStorage = [];
        let content = [];
        for (let i = 0; i < results.length; i++) {
            const item = results[i];
            if (arrNametoCCA3.hasOwnProperty(item)) {
                if (localStorage.getItem(arrNametoCCA3[item]) !== null) {
                    if (contentStorage.length < 5) {
                        contentStorage.push(`<li class="red-text">${item}</li>`);
                    }
                } else {
                    content.push(`<li class="green-text">${item}</li>`);
                }
            }
        }
        content = content.slice(0, 10 - contentStorage.length);
        searchWrapper.classList.add('show');
        resultsWrapper.innerHTML = `<ul>${contentStorage.join('')}${content.join('')}</ul>`;
    }
    // event from storage
    window.addEventListener('storage', () => {
        uploadLastSaveCountryes();
    });
})();
