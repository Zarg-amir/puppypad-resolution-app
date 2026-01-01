// ============================================
// COUNTRIES DATA
// Complete list of countries with dial codes and flags
// ============================================

const COUNTRIES = [
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
  { code: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹' },
  { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮' },
  { code: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', dial: '+420', flag: '🇨🇿' },
  { code: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷' },
  { code: 'HU', name: 'Hungary', dial: '+36', flag: '🇭🇺' },
  { code: 'RO', name: 'Romania', dial: '+40', flag: '🇷🇴' },
  { code: 'BG', name: 'Bulgaria', dial: '+359', flag: '🇧🇬' },
  { code: 'HR', name: 'Croatia', dial: '+385', flag: '🇭🇷' },
  { code: 'SK', name: 'Slovakia', dial: '+421', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', dial: '+386', flag: '🇸🇮' },
  { code: 'LT', name: 'Lithuania', dial: '+370', flag: '🇱🇹' },
  { code: 'LV', name: 'Latvia', dial: '+371', flag: '🇱🇻' },
  { code: 'EE', name: 'Estonia', dial: '+372', flag: '🇪🇪' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { code: 'HK', name: 'Hong Kong', dial: '+852', flag: '🇭🇰' },
  { code: 'TW', name: 'Taiwan', dial: '+886', flag: '🇹🇼' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳' },
  { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', dial: '+94', flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', dial: '+977', flag: '🇳🇵' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', dial: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', dial: '+968', flag: '🇴🇲' },
  { code: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱' },
  { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
  { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', dial: '+380', flag: '🇺🇦' },
  { code: 'BY', name: 'Belarus', dial: '+375', flag: '🇧🇾' },
  { code: 'KZ', name: 'Kazakhstan', dial: '+7', flag: '🇰🇿' },
  { code: 'UZ', name: 'Uzbekistan', dial: '+998', flag: '🇺🇿' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'MA', name: 'Morocco', dial: '+212', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia', dial: '+216', flag: '🇹🇳' },
  { code: 'DZ', name: 'Algeria', dial: '+213', flag: '🇩🇿' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', dial: '+51', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', dial: '+58', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', dial: '+593', flag: '🇪🇨' },
  { code: 'UY', name: 'Uruguay', dial: '+598', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', dial: '+595', flag: '🇵🇾' },
  { code: 'BO', name: 'Bolivia', dial: '+591', flag: '🇧🇴' },
  { code: 'CR', name: 'Costa Rica', dial: '+506', flag: '🇨🇷' },
  { code: 'PA', name: 'Panama', dial: '+507', flag: '🇵🇦' },
  { code: 'GT', name: 'Guatemala', dial: '+502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', dial: '+504', flag: '🇭🇳' },
  { code: 'SV', name: 'El Salvador', dial: '+503', flag: '🇸🇻' },
  { code: 'NI', name: 'Nicaragua', dial: '+505', flag: '🇳🇮' },
  { code: 'DO', name: 'Dominican Republic', dial: '+1', flag: '🇩🇴' },
  { code: 'PR', name: 'Puerto Rico', dial: '+1', flag: '🇵🇷' },
  { code: 'JM', name: 'Jamaica', dial: '+1', flag: '🇯🇲' },
  { code: 'TT', name: 'Trinidad and Tobago', dial: '+1', flag: '🇹🇹' },
  { code: 'BS', name: 'Bahamas', dial: '+1', flag: '🇧🇸' },
  { code: 'BB', name: 'Barbados', dial: '+1', flag: '🇧🇧' },
  { code: 'CU', name: 'Cuba', dial: '+53', flag: '🇨🇺' },
  { code: 'HT', name: 'Haiti', dial: '+509', flag: '🇭🇹' },
  { code: 'IS', name: 'Iceland', dial: '+354', flag: '🇮🇸' },
  { code: 'LU', name: 'Luxembourg', dial: '+352', flag: '🇱🇺' },
  { code: 'MT', name: 'Malta', dial: '+356', flag: '🇲🇹' },
  { code: 'CY', name: 'Cyprus', dial: '+357', flag: '🇨🇾' },
  { code: 'RS', name: 'Serbia', dial: '+381', flag: '🇷🇸' },
  { code: 'BA', name: 'Bosnia and Herzegovina', dial: '+387', flag: '🇧🇦' },
  { code: 'ME', name: 'Montenegro', dial: '+382', flag: '🇲🇪' },
  { code: 'MK', name: 'North Macedonia', dial: '+389', flag: '🇲🇰' },
  { code: 'AL', name: 'Albania', dial: '+355', flag: '🇦🇱' },
  { code: 'MD', name: 'Moldova', dial: '+373', flag: '🇲🇩' },
  { code: 'GE', name: 'Georgia', dial: '+995', flag: '🇬🇪' },
  { code: 'AM', name: 'Armenia', dial: '+374', flag: '🇦🇲' },
  { code: 'AZ', name: 'Azerbaijan', dial: '+994', flag: '🇦🇿' },
  { code: 'MN', name: 'Mongolia', dial: '+976', flag: '🇲🇳' },
  { code: 'KH', name: 'Cambodia', dial: '+855', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', dial: '+856', flag: '🇱🇦' },
  { code: 'MM', name: 'Myanmar', dial: '+95', flag: '🇲🇲' },
  { code: 'BN', name: 'Brunei', dial: '+673', flag: '🇧🇳' },
  { code: 'MO', name: 'Macau', dial: '+853', flag: '🇲🇴' },
  { code: 'AF', name: 'Afghanistan', dial: '+93', flag: '🇦🇫' },
  { code: 'IQ', name: 'Iraq', dial: '+964', flag: '🇮🇶' },
  { code: 'IR', name: 'Iran', dial: '+98', flag: '🇮🇷' },
  { code: 'JO', name: 'Jordan', dial: '+962', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', dial: '+961', flag: '🇱🇧' },
  { code: 'SY', name: 'Syria', dial: '+963', flag: '🇸🇾' },
  { code: 'YE', name: 'Yemen', dial: '+967', flag: '🇾🇪' },
  { code: 'ET', name: 'Ethiopia', dial: '+251', flag: '🇪🇹' },
  { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
  { code: 'SN', name: 'Senegal', dial: '+221', flag: '🇸🇳' },
  { code: 'CI', name: 'Ivory Coast', dial: '+225', flag: '🇨🇮' },
  { code: 'CM', name: 'Cameroon', dial: '+237', flag: '🇨🇲' },
  { code: 'AO', name: 'Angola', dial: '+244', flag: '🇦🇴' },
  { code: 'MZ', name: 'Mozambique', dial: '+258', flag: '🇲🇿' },
  { code: 'ZW', name: 'Zimbabwe', dial: '+263', flag: '🇿🇼' },
  { code: 'ZM', name: 'Zambia', dial: '+260', flag: '🇿🇲' },
  { code: 'BW', name: 'Botswana', dial: '+267', flag: '🇧🇼' },
  { code: 'NA', name: 'Namibia', dial: '+264', flag: '🇳🇦' },
  { code: 'MU', name: 'Mauritius', dial: '+230', flag: '🇲🇺' },
  { code: 'MG', name: 'Madagascar', dial: '+261', flag: '🇲🇬' },
  { code: 'RE', name: 'Reunion', dial: '+262', flag: '🇷🇪' },
  { code: 'LY', name: 'Libya', dial: '+218', flag: '🇱🇾' },
  { code: 'SD', name: 'Sudan', dial: '+249', flag: '🇸🇩' },
  { code: 'FJ', name: 'Fiji', dial: '+679', flag: '🇫🇯' },
  { code: 'PG', name: 'Papua New Guinea', dial: '+675', flag: '🇵🇬' },
  { code: 'NC', name: 'New Caledonia', dial: '+687', flag: '🇳🇨' },
  { code: 'PF', name: 'French Polynesia', dial: '+689', flag: '🇵🇫' },
  { code: 'GU', name: 'Guam', dial: '+1', flag: '🇬🇺' },
  { code: 'VI', name: 'US Virgin Islands', dial: '+1', flag: '🇻🇮' },
  { code: 'AS', name: 'American Samoa', dial: '+1', flag: '🇦🇸' },
  { code: 'MP', name: 'Northern Mariana Islands', dial: '+1', flag: '🇲🇵' },
  { code: 'BM', name: 'Bermuda', dial: '+1', flag: '🇧🇲' },
  { code: 'KY', name: 'Cayman Islands', dial: '+1', flag: '🇰🇾' },
  { code: 'VG', name: 'British Virgin Islands', dial: '+1', flag: '🇻🇬' },
  { code: 'TC', name: 'Turks and Caicos', dial: '+1', flag: '🇹🇨' },
  { code: 'AG', name: 'Antigua and Barbuda', dial: '+1', flag: '🇦🇬' },
  { code: 'DM', name: 'Dominica', dial: '+1', flag: '🇩🇲' },
  { code: 'GD', name: 'Grenada', dial: '+1', flag: '🇬🇩' },
  { code: 'KN', name: 'Saint Kitts and Nevis', dial: '+1', flag: '🇰🇳' },
  { code: 'LC', name: 'Saint Lucia', dial: '+1', flag: '🇱🇨' },
  { code: 'VC', name: 'Saint Vincent', dial: '+1', flag: '🇻🇨' },
  { code: 'AW', name: 'Aruba', dial: '+297', flag: '🇦🇼' },
  { code: 'CW', name: 'Curacao', dial: '+599', flag: '🇨🇼' },
  { code: 'SX', name: 'Sint Maarten', dial: '+1', flag: '🇸🇽' },
  { code: 'BZ', name: 'Belize', dial: '+501', flag: '🇧🇿' },
  { code: 'GY', name: 'Guyana', dial: '+592', flag: '🇬🇾' },
  { code: 'SR', name: 'Suriname', dial: '+597', flag: '🇸🇷' },
  { code: 'GF', name: 'French Guiana', dial: '+594', flag: '🇬🇫' },
  { code: 'FK', name: 'Falkland Islands', dial: '+500', flag: '🇫🇰' },
  { code: 'GL', name: 'Greenland', dial: '+299', flag: '🇬🇱' },
  { code: 'FO', name: 'Faroe Islands', dial: '+298', flag: '🇫🇴' },
  { code: 'GI', name: 'Gibraltar', dial: '+350', flag: '🇬🇮' },
  { code: 'AD', name: 'Andorra', dial: '+376', flag: '🇦🇩' },
  { code: 'MC', name: 'Monaco', dial: '+377', flag: '🇲🇨' },
  { code: 'SM', name: 'San Marino', dial: '+378', flag: '🇸🇲' },
  { code: 'VA', name: 'Vatican City', dial: '+39', flag: '🇻🇦' },
  { code: 'LI', name: 'Liechtenstein', dial: '+423', flag: '🇱🇮' },
  { code: 'JE', name: 'Jersey', dial: '+44', flag: '🇯🇪' },
  { code: 'GG', name: 'Guernsey', dial: '+44', flag: '🇬🇬' },
  { code: 'IM', name: 'Isle of Man', dial: '+44', flag: '🇮🇲' },
  { code: 'MV', name: 'Maldives', dial: '+960', flag: '🇲🇻' },
  { code: 'BT', name: 'Bhutan', dial: '+975', flag: '🇧🇹' },
  { code: 'TL', name: 'Timor-Leste', dial: '+670', flag: '🇹🇱' },
  { code: 'WS', name: 'Samoa', dial: '+685', flag: '🇼🇸' },
  { code: 'TO', name: 'Tonga', dial: '+676', flag: '🇹🇴' },
  { code: 'VU', name: 'Vanuatu', dial: '+678', flag: '🇻🇺' },
  { code: 'SB', name: 'Solomon Islands', dial: '+677', flag: '🇸🇧' },
  { code: 'KI', name: 'Kiribati', dial: '+686', flag: '🇰🇮' },
  { code: 'MH', name: 'Marshall Islands', dial: '+692', flag: '🇲🇭' },
  { code: 'FM', name: 'Micronesia', dial: '+691', flag: '🇫🇲' },
  { code: 'PW', name: 'Palau', dial: '+680', flag: '🇵🇼' },
  { code: 'NR', name: 'Nauru', dial: '+674', flag: '🇳🇷' },
  { code: 'TV', name: 'Tuvalu', dial: '+688', flag: '🇹🇻' },
  { code: 'CK', name: 'Cook Islands', dial: '+682', flag: '🇨🇰' },
  { code: 'NU', name: 'Niue', dial: '+683', flag: '🇳🇺' },
  { code: 'TK', name: 'Tokelau', dial: '+690', flag: '🇹🇰' },
  { code: 'SC', name: 'Seychelles', dial: '+248', flag: '🇸🇨' },
  { code: 'CV', name: 'Cape Verde', dial: '+238', flag: '🇨🇻' },
  { code: 'ST', name: 'Sao Tome and Principe', dial: '+239', flag: '🇸🇹' },
  { code: 'GQ', name: 'Equatorial Guinea', dial: '+240', flag: '🇬🇶' },
  { code: 'GA', name: 'Gabon', dial: '+241', flag: '🇬🇦' },
  { code: 'CG', name: 'Republic of the Congo', dial: '+242', flag: '🇨🇬' },
  { code: 'CD', name: 'DR Congo', dial: '+243', flag: '🇨🇩' },
  { code: 'CF', name: 'Central African Republic', dial: '+236', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad', dial: '+235', flag: '🇹🇩' },
  { code: 'NE', name: 'Niger', dial: '+227', flag: '🇳🇪' },
  { code: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫' },
  { code: 'BJ', name: 'Benin', dial: '+229', flag: '🇧🇯' },
  { code: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬' },
  { code: 'GN', name: 'Guinea', dial: '+224', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinea-Bissau', dial: '+245', flag: '🇬🇼' },
  { code: 'SL', name: 'Sierra Leone', dial: '+232', flag: '🇸🇱' },
  { code: 'LR', name: 'Liberia', dial: '+231', flag: '🇱🇷' },
  { code: 'MR', name: 'Mauritania', dial: '+222', flag: '🇲🇷' },
  { code: 'GM', name: 'Gambia', dial: '+220', flag: '🇬🇲' },
  { code: 'BI', name: 'Burundi', dial: '+257', flag: '🇧🇮' },
  { code: 'DJ', name: 'Djibouti', dial: '+253', flag: '🇩🇯' },
  { code: 'ER', name: 'Eritrea', dial: '+291', flag: '🇪🇷' },
  { code: 'SO', name: 'Somalia', dial: '+252', flag: '🇸🇴' },
  { code: 'SS', name: 'South Sudan', dial: '+211', flag: '🇸🇸' },
  { code: 'MW', name: 'Malawi', dial: '+265', flag: '🇲🇼' },
  { code: 'LS', name: 'Lesotho', dial: '+266', flag: '🇱🇸' },
  { code: 'SZ', name: 'Eswatini', dial: '+268', flag: '🇸🇿' },
  { code: 'KM', name: 'Comoros', dial: '+269', flag: '🇰🇲' },
  { code: 'YT', name: 'Mayotte', dial: '+262', flag: '🇾🇹' },
  { code: 'PS', name: 'Palestine', dial: '+970', flag: '🇵🇸' },
  { code: 'XK', name: 'Kosovo', dial: '+383', flag: '🇽🇰' },
  { code: 'KP', name: 'North Korea', dial: '+850', flag: '🇰🇵' },
  { code: 'TM', name: 'Turkmenistan', dial: '+993', flag: '🇹🇲' },
  { code: 'TJ', name: 'Tajikistan', dial: '+992', flag: '🇹🇯' },
  { code: 'KG', name: 'Kyrgyzstan', dial: '+996', flag: '🇰🇬' }
];

// Get country by code
function getCountryByCode(code) {
  return COUNTRIES.find(c => c.code === code) || COUNTRIES[0];
}

// Get country by dial code (returns first match)
function getCountryByDial(dial) {
  return COUNTRIES.find(c => c.dial === dial) || COUNTRIES[0];
}

// Generate country selector HTML for phone input
function generateCountryCodeSelector(selectedCode = 'US') {
  const selected = getCountryByCode(selectedCode);

  const optionsHtml = COUNTRIES.map(c =>
    `<option value="${c.code}" ${c.code === selectedCode ? 'selected' : ''}>${c.flag} ${c.name} (${c.dial})</option>`
  ).join('');

  return `
    <div class="country-code-selector">
      <select class="country-code-select" id="countryCodeSelect" onchange="updatePhoneCountryCode()">
        ${optionsHtml}
      </select>
      <span class="country-code-display" id="countryCodeDisplay">${selected.flag} ${selected.dial}</span>
    </div>
  `;
}

// Generate country dropdown for shipping address
function generateCountryDropdown(selectedCode = 'US', id = 'shippingCountry') {
  const optionsHtml = COUNTRIES.map(c =>
    `<option value="${c.code}" ${c.code === selectedCode ? 'selected' : ''}>${c.flag} ${c.name}</option>`
  ).join('');

  return `
    <select class="form-input" id="${id}">
      ${optionsHtml}
    </select>
  `;
}

// Get selected country code from selector
function getSelectedCountryCode() {
  const select = document.getElementById('countryCodeSelect');
  if (!select) return '+1';
  const country = getCountryByCode(select.value);
  return country.dial;
}

// Update the display when country changes
function updatePhoneCountryCode() {
  const select = document.getElementById('countryCodeSelect');
  const display = document.getElementById('countryCodeDisplay');
  if (!select || !display) return;

  const country = getCountryByCode(select.value);
  display.textContent = `${country.flag} ${country.dial}`;

  // Update phone input placeholder
  const phoneInput = document.getElementById('inputPhone');
  if (phoneInput) {
    phoneInput.placeholder = getPhonePlaceholder(country.code);
  }
}

// Get phone placeholder by country
function getPhonePlaceholder(countryCode) {
  const placeholders = {
    'US': '(555) 000-0000',
    'CA': '(555) 000-0000',
    'GB': '7911 123456',
    'AU': '412 345 678',
    'DE': '151 12345678',
    'FR': '6 12 34 56 78',
    'default': '000 000 0000'
  };
  return placeholders[countryCode] || placeholders['default'];
}

// Export for use in app.js
window.COUNTRIES = COUNTRIES;
window.getCountryByCode = getCountryByCode;
window.getCountryByDial = getCountryByDial;
window.generateCountryCodeSelector = generateCountryCodeSelector;
window.generateCountryDropdown = generateCountryDropdown;
window.getSelectedCountryCode = getSelectedCountryCode;
window.updatePhoneCountryCode = updatePhoneCountryCode;
window.getPhonePlaceholder = getPhonePlaceholder;
