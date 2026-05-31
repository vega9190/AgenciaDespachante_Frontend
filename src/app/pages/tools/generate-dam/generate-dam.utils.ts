import countriesData from './files/countries.json';
import seaportsData from './files/seaports.json';

type CountryJsonItem = {
  code: string;
  country: string;
};

type SeaportJsonItem = {
  code: string;
  country: string | null;
  city: string;
  state: string | null;
};

type SeaportResult = {
  code: string;
  city: string;
  state: string | null;
  country: string;
};

const DEFAULT_COUNTRY_CODE = 'US';
const DEFAULT_SEAPORT: SeaportResult = {
  code: 'USFPO',
  city: 'Freeport',
  state: 'TX',
  country: 'US'
};

function toSeaportResult(seaport: SeaportJsonItem): SeaportResult {
  return {
    code: seaport.code,
    city: seaport.city,
    state: seaport.state,
    country: seaport.country ?? ''
  };
}

function searchSeaport(cityLower: string, parsedState: string | null): SeaportResult | undefined {
  if (parsedState) {
    const exactMatch = (seaportsData as SeaportJsonItem[]).find(
      (seaport) => seaport.city.toLowerCase() === cityLower && seaport.state === parsedState
    );

    if (exactMatch) {
      return toSeaportResult(exactMatch);
    }
  }

  const cityMatch = (seaportsData as SeaportJsonItem[]).find((seaport) => seaport.city.toLowerCase() === cityLower);

  if (cityMatch) {
    return toSeaportResult(cityMatch);
  }

  const includesMatch = (seaportsData as SeaportJsonItem[]).find((seaport) => seaport.city.toLowerCase().includes(cityLower));
  return includesMatch ? toSeaportResult(includesMatch) : undefined;
}

export function getCountryCode(countryName: string | null | undefined): string {
  if (!countryName?.trim()) {
    return DEFAULT_COUNTRY_CODE;
  }

  const normalizedCountry = countryName.trim().toLowerCase();
  const match = (countriesData as CountryJsonItem[]).find((country) => country.country.toLowerCase() === normalizedCountry);
  return match?.code ?? DEFAULT_COUNTRY_CODE;
}

export function getSeaportCode(portCity: string | null | undefined): SeaportResult {
  if (!portCity?.trim()) {
    return DEFAULT_SEAPORT;
  }

  let parsedCity = portCity.trim();
  let parsedState: string | null = null;

  const commaMatch = parsedCity.match(/^(.+?),\s*([A-Za-z]{2})$/);
  const spaceMatch = parsedCity.match(/^(.+)\s+([A-Za-z]{2})$/);

  if (commaMatch) {
    parsedCity = commaMatch[1].trim();
    parsedState = commaMatch[2].toUpperCase();
  } else if (spaceMatch) {
    parsedCity = spaceMatch[1].trim();
    parsedState = spaceMatch[2].toUpperCase();
  }

  return searchSeaport(parsedCity.toLowerCase(), parsedState) ?? DEFAULT_SEAPORT;
}

export function normalizeArancelCode(code: string | null | undefined): string {
  return (code ?? '').replace(/\./g, '').trim();
}

export function downloadJsonFile(fileName: string, content: unknown): void {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}
