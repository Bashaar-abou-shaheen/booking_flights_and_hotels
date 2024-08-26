const Airport = require('../models/flight/airport');
const Flight = require('../models/flight/flight');
const FavoriteFlight = require('../models/flight/favoriteFlight');
const Seat = require('../models/flight/seat');
const Hotel = require('../models/hotel/hotel');
const FavoriteHotel = require('../models/hotel/favoriteHotel');
const Room = require('../models/hotel/hotelRoom')
const City = require('../models/city')

exports.createAllData = async (req, res, next) => {
  try {

        // Create a dummy airport
        const cities = [
                { city: "New York City", country: "United States", continent: "northamerica", hotel: "The Plaza Hotel", imgUrl: '/images/1.jpg' },
                { city: "Los Angeles", country: "United States", continent: "northamerica", hotel: "The Beverly Hills Hotel", imgUrl: '/images/2.jpg' },
                { city: "Chicago", country: "United States", continent: "northamerica", hotel: "The Peninsula Chicago", imgUrl: '/images/3.jpg' },
                { city: "Toronto", country: "Canada", continent: "northamerica", hotel: "The Omni King Edward Hotel", imgUrl: '/images/4.jpg' },
                { city: "San Francisco", country: "United States", continent: "northamerica", hotel: "The Fairmont San Francisco", imgUrl: '/images/5.jpg' },
                { city: "Buenos Aires", country: "Argentina", continent: "southamerica", hotel: "The Alvear Palace Hotel", imgUrl: '/images/6.jpg' },
                { city: "Rio de Janeiro", country: "Brazil", continent: "southamerica", hotel: "The Copacabana Palace", imgUrl: '/images/7.jpg' },
                { city: "Santiago", country: "Chile", continent: "southamerica", hotel: "The Hotel Ritz-Carlton, Santiago", imgUrl: '/images/8.jpg' },
                { city: "Lima", country: "Peru", continent: "southamerica", hotel: "The Miraflores Park Hotel", imgUrl: '/images/9.jpg' },
                { city: "Medellin", country: "Colombia", continent: "southamerica", hotel: "The Hotel Charlee", imgUrl: '/images/10.jpg' },
                { city: "London", country: "United Kingdom", continent: "europe", hotel: "The Savoy", imgUrl: '/images/11.jpg' },
                { city: "Paris", country: "France", continent: "europe", hotel: "The Ritz Paris", imgUrl: '/images/12.jpg' },
                { city: "Rome", country: "Italy", continent: "europe", hotel: "The Hotel de Russie", imgUrl: '/images/13.jpg' },
                { city: "Barcelona", country: "Spain", continent: "europe", hotel: "The Hotel Soho Barcelona", imgUrl: '/images/14.jpg' },
                { city: "Amsterdam", country: "Netherlands", continent: "europe", hotel: "The Pulitzer Amsterdam", imgUrl: '/images/15.jpg' },
                { city: "Tokyo", country: "Japan", continent: "asia", hotel: "The Imperial Hotel", imgUrl: '/images/16.jpg' },
                { city: "Hong Kong", country: "China", continent: "asia", hotel: "The Peninsula Hong Kong", imgUrl: '/images/17.jpg' },
                { city: "Singapore", country: "Singapore", continent: "asia", hotel: "The Marina Bay Sands", imgUrl: '/images/18.jpg' },
                { city: "Bangkok", country: "Thailand", continent: "asia", hotel: "The Mandarin Oriental, Bangkok", imgUrl: '/images/19.jpg' },
                { city: "Seoul", country: "South Korea", continent: "asia", hotel: "The Shilla Seoul", imgUrl: '/images/20.jpg' },
                { city: "Cairo", country: "Egypt", continent: "africa", hotel: "The Four Seasons Hotel Cairo at Nile Plaza", imgUrl: '/images/21.jpg' },
                { city: "Johannesburg", country: "South Africa", continent: "africa", hotel: "The Saxon Hotel, Villas & Spa", imgUrl: '/images/22.jpg' },
                { city: "Cape Town", country: "South Africa", continent: "africa", hotel: "The Table Bay Hotel", imgUrl: '/images/23.jpg' },
                { city: "Lagos", country: "Nigeria", continent: "africa", hotel: "The Eko Hotels & Suites", imgUrl: '/images/24.jpg' },
                { city: "Nairobi", country: "Kenya", continent: "africa", hotel: "The Sarova Stanley Hotel", imgUrl: '/images/25.jpg' },
                { city: "Sydney", country: "Australia", continent: "australia", hotel: "The Sydney Opera House", imgUrl: '/images/26.jpg' },
                { city: "Melbourne", country: "Australia", continent: "australia", hotel: "The Crown Towers Melbourne", imgUrl: '/images/27.jpg' },
                { city: "Brisbane", country: "Australia", continent: "australia", hotel: "The Treasury Hotel", imgUrl: '/images/28.jpg' },
                { city: "Perth", country: "Australia", continent: "australia", hotel: "The COMO The Treasury", imgUrl: '/images/29.jpg' },
                { city: "Adelaide", country: "Australia", continent: "australia", hotel: "The Adelaide Hilton", imgUrl: '/images/30.jpg' },
                { city: "McMurdo Station", country: "Antarctica", continent: "antarctica", hotel: "McMurdo Station", imgUrl: '/images/31.jpg' }, 
                { city: "Amundsen-Scott South Pole Station", country: "Antarctica", continent: "antarctica", hotel: "Amundsen-Scott South Pole Station", imgUrl: '/images/32.jpg' }, 
                { city: "Palmer Station", country: "Antarctica", continent: "antarctica", hotel: "Palmer Station", imgUrl: '/images/33.jpg' }, 
                { city: "Vostok Station", country: "Antarctica", continent: "antarctica", hotel: "Vostok Station", imgUrl: '/images/34.jpg' }, 
                { city: "Mawson Station", country: "Antarctica", continent: "antarctica", hotel: "Mawson Station", imgUrl: '/images/35.jpg' } 
              ];
        
        const flightNames =[
                "American Airlines",
                "Delta Air Lines",
                "United Airlines",
                "Southwest Airlines",
                "British Airways",
                "Air France",
                "Lufthansa",
                "Emirates",
                "Qatar Airways",
                "Singapore Airlines",
                "JetBlue Airways",
                "Alaska Airlines",
                "Frontier Airlines",
                "Spirit Airlines",
                "Ryanair",
                "easyJet",
                "Norwegian Air Shuttle",
                "Vueling",
                "WestJet",
                "Air Canada"
              ]
        const airLines = [
                "American Airlines",
                "Delta Air Lines",
                "United Airlines",
                "Southwest Airlines",
                "British Airways",
                "Air France",
                "Lufthansa",
                "Emirates",
                "Qatar Airways",
                "Singapore Airlines",
                "JetBlue Airways",
                "Alaska Airlines",
                "Frontier Airlines",
                "Spirit Airlines",
                "Ryanair",
                "easyJet",
                "Norwegian Air Shuttle",
                "Vueling",
                "WestJet",
                "Air Canada"
              ];
        
        const vibes = ['romantic','sightseeing','nightlife','citytrip','budjetfriendly']
        for(let j = 0; j < cities.length; j++){
                const cityData = {
                        name: cities[j].city,
                        country: cities[j].country,
                        continent : cities[j].continent,
                        vibe:vibes[Math.floor(Math.random() *vibes.length)],
                        imageUrl : cities[j].imgUrl
                };
                const city = new City(cityData);
                await city.save();
        }
        const foundedCities = await City.find({})

        for(let j = 0; j <= 19; j++){
                const airportData = {
                        name: flightNames[j],
                        code: Math.floor(Math.random() * 1000000),
                        city: foundedCities[j]._id,
                };
                const airport = new Airport(airportData);
                await airport.save();
        }
        const allAirPorts = await Airport.find({}).populate('city')

        for(let j = 0; j <= 2000; j++){
                let firstAirPort = allAirPorts[Math.floor(Math.random() * allAirPorts.length)]
                let secondAirPort = allAirPorts[Math.floor(Math.random() * allAirPorts.length)]
                while(firstAirPort == secondAirPort){
                        secondAirPort = allAirPorts[Math.floor(Math.random() * allAirPorts.length)]
                }
                const founded = cities.find(e=>e.city === secondAirPort.city.name)
                // console.log(founded);
                const startDate = new Date('2024-08-15'); // replace YYYY-MM-DD with your start date
                const endDate = new Date('2024-12-29'); // replace YYYY-MM-DD with your end date
                const timeDifference = endDate.getTime() - startDate.getTime();
                const randomTime = Math.random() * timeDifference;
                const randomDateTimestamp = startDate.getTime() + randomTime;
                const randomDate = new Date(randomDateTimestamp);


                const randomDate2 = new Date(randomDate.getTime() + 4 * 60 * 60 * 1000);


                // Create a dummy flight
                const flightData = {
                  flightNumber: Math.floor(Math.random() * 100000)*Math.floor(Math.random() * 100000) ,
                  airLine: airLines[Math.floor(Math.random() * airLines.length)],
                  description : "Take flight and explore the world! Your adventure begins here. Discover new cultures, breathtaking landscapes, and unforgettable experiences",
                  departureAirport: firstAirPort._id, // Use the created airport ID
                  arrivalAirport: secondAirPort._id, // Use the created airport ID
                  departureTime: randomDate,
                  arrivalTime: randomDate2,
                  price: 300,
                  imageUrl : ['/images/f2.jpg',founded.imgUrl,'/images/f3.jpg']
                };
                const flight = new Flight(flightData);
                await flight.save();
    
                // Create dummy seats for the flight
                const seatClasses = ['economy', 'business', 'first','premiumeconomy'];
                const seats = [];
                for(let k = 0; k <= 3; k++){
                        for (let i = 1; i <= 15; i++) {
                          const seatClassNumber = k
                          const seatClass = seatClasses[seatClassNumber];
                          const seatNumber = `${seatClasses[seatClassNumber][0]}${i}`;
                          seats.push({
                            seatNumber: seatNumber,
                            seatClass: seatClass,
                            isAvailable: true,
                            flight: flight._id,
                          });
                }
            }
            await Seat.insertMany(seats);

        }



        // Create a dummy hotel
        for(let j = 0; j <cities.length; j++){
                const rate = Math.floor(Math.random() * 6)
                const hotelData = {
                        name: cities[j].hotel,
                        country: cities[j].continent,
                        city: foundedCities[j]._id,
                        description: 'Luxury hotel with stunning views',
                        rating: rate,
                        pricePerNight: rate *400,
                        imageUrl : cities[j].imgUrl
                };
                const hotel = new Hotel(hotelData);
                await hotel.save();
        
                // Create dummy rooms for the hotel
                const roomClasses =  [
                        {
                          type: 'single',
                          description: 'Perfect for solo travelers. Enjoy a comfortable and private space with all the essentials for a relaxing stay. Our single rooms are ideal for those who value independence and a quiet retreat.'
                        },
                        {
                          type: 'double',
                          description: 'Ideal for couples. Our double rooms feature a spacious and inviting atmosphere with a comfortable double bed, perfect for a romantic getaway or a relaxing retreat.'
                        },
                        {
                          type: 'twin',
                          description: 'Perfect for friends or family. Our twin rooms offer two single beds, providing a comfortable and separate sleeping space for each guest. Ideal for travelers who prefer individual beds.'
                        },
                        {
                          type: 'triple',
                          description: 'Accommodating for small groups. Our triple rooms offer a comfortable and spacious solution for three guests, perfect for families or friends traveling together.'
                        },
                        {
                          type: 'quad',
                          description: 'Ideal for families or larger groups. Our quad rooms provide ample space and comfort for up to four guests, perfect for families or friends traveling together.'
                        },
                        {
                          type: 'presidential',
                          description: 'The ultimate luxury experience. Our presidential suite offers unparalleled luxury and exclusivity, featuring a spacious living area, a private balcony with stunning views, and a dedicated butler service.'
                        }
                      ];
                const rooms = [];
                for (let i = 1; i <= 20; i++) {
                        const num = Math.floor(Math.random() * roomClasses.length)
                        const roomClass = roomClasses[num].type;
                        const description2 = roomClasses[num].description;
                        const roomNumber = `room-${i}`;
                        rooms.push({
                        roomNumber: roomNumber,
                        roomClass: roomClass,
                        description: description2,
                        isAvailable: true,
                        hotel: hotel._id,
                        imageUrl : '/images/room.jpg'
                        });
                }
        
                await Room.insertMany(rooms);

        }

        res.status(201).json({ message: 'Data created successfully' });
        } catch (err) {
                if (!err.statusCode) {
                err.statusCode = 500;
                }
                next(err);
        }
};