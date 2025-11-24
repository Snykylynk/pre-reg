// Predefined options for pickers

export const LANGUAGES = [
  // South African Official Languages
  'English',
  'Afrikaans',
  'Zulu',
  'Xhosa',
  'Northern Sotho',
  'Tswana',
  'Southern Sotho',
  'Tsonga',
  'Swati',
  'Venda',
  'Ndebele',
  
  // Other Common Languages
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Chinese (Mandarin)',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Russian',
  'Dutch',
  'Swedish',
  'Norwegian',
  'Danish',
  'Finnish',
  'Polish',
  'Turkish',
  'Greek',
  'Hebrew',
  'Thai',
  'Vietnamese',
  'Other',
]

export const ESCORT_SERVICES = [
  'Social Events',
  'Business Meetings',
  'Dinner Companionship',
  'Travel Companionship',
  'Event Companion',
  'Corporate Functions',
  'Gala Events',
  'Wedding Companion',
  'Photoshoot Modeling',
  'Fashion Shows',
  'Other',
]

export const AVAILABILITY_OPTIONS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export const VEHICLE_MAKES = [
  'Toyota',
  'Honda',
  'Ford',
  'Chevrolet',
  'Nissan',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Volkswagen',
  'Hyundai',
  'Kia',
  'Mazda',
  'Subaru',
  'Lexus',
  'Acura',
  'Infiniti',
  'Cadillac',
  'Lincoln',
  'Jeep',
  'Ram',
  'GMC',
  'Dodge',
  'Chrysler',
  'Buick',
  'Volvo',
  'Tesla',
  'Other',
]

export const VEHICLE_YEARS = Array.from({ length: 30 }, (_, i) => {
  const year = new Date().getFullYear() - i
  return year.toString()
})

export const SOUTH_AFRICAN_CITIES = [
  // Major Metropolitan Areas
  'Johannesburg',
  'Cape Town',
  'Durban',
  'Pretoria',
  'Port Elizabeth',
  'East London',
  'Bloemfontein',
  'Nelspruit',
  'Polokwane',
  'Kimberley',
  
  // Gauteng Province
  'Alexandra',
  'Benoni',
  'Boksburg',
  'Brakpan',
  'Carletonville',
  'Diepsloot',
  'Germiston',
  'Katlehong',
  'Kempton Park',
  'Krugersdorp',
  'Midrand',
  'Randburg',
  'Roodepoort',
  'Sandton',
  'Soweto',
  'Tembisa',
  'Vereeniging',
  'Westonaria',
  
  // Western Cape Province
  'Caledon',
  'George',
  'Gugulethu',
  'Hermanus',
  'Khayelitsha',
  'Knysna',
  'Malmesbury',
  'Mitchells Plain',
  'Mossel Bay',
  'Oudtshoorn',
  'Paarl',
  'Saldanha',
  'Stellenbosch',
  'Vredenburg',
  'Worcester',
  
  // KwaZulu-Natal Province
  'Amanzimtoti',
  'Ballito',
  'Inanda',
  'Ladysmith',
  'Margate',
  'Newcastle',
  'Pietermaritzburg',
  'Pinetown',
  'Port Shepstone',
  'Richards Bay',
  'Scottburgh',
  'Umhlanga',
  'Umlazi',
  
  // Eastern Cape Province
  'Grahamstown',
  'Jeffreys Bay',
  'King William\'s Town',
  'Mthatha',
  'Port Alfred',
  'Queenstown',
  'Uitenhage',
  
  // Free State Province
  'Bethlehem',
  'Kroonstad',
  'Sasolburg',
  'Virginia',
  'Welkom',
  
  // Mpumalanga Province
  'Ermelo',
  'Middelburg',
  'Secunda',
  'Standerton',
  'Witbank',
  
  // Limpopo Province
  'Louis Trichardt',
  'Musina',
  'Phalaborwa',
  'Thohoyandou',
  'Tzaneen',
  
  // North West Province
  'Brits',
  'Klerksdorp',
  'Mahikeng',
  'Potchefstroom',
  'Rustenburg',
  
  // Northern Cape Province
  'De Aar',
  'Kuruman',
  'Springbok',
  'Upington',
  
  // Other Notable Areas
  'Sun City',
]

// Service areas for taxi owners - using South African cities
export const SERVICE_AREAS = SOUTH_AFRICAN_CITIES

