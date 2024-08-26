const { validationResult } =require('express-validator')
const moment = require('moment-timezone');


const Hotel = require('../models/hotel/hotel');
const Room = require('../models/hotel/hotelRoom')
const City = require('../models/city');
const RoomBooking = require('../models/hotel/hotelRoomBooking');
const Airport = require('../models/flight/airport');
const Flight = require('../models/flight/flight');
const Seat = require('../models/flight/seat');
const FlightBooking = require('../models/flight/flightBooking')
const HotelBooking = require("../models/hotel/hotelBooking")

const getCityIdsByName = async (name) => {
    const cities = await City.find({
        name: { $regex: `^${name}`, $options: 'i' }
    });
    return cities.map(city => city._id);
};

const getAirportIdsByCityIds = async (cityIds) => {
    const airports = await Airport.find({ city: { $in: cityIds } }).populate('city');
    return airports.map(airport => airport._id);
};

const getFlights = async (departureAirportIds, arrivalAirportIds, dateRange) => {
    return await Flight.find({
        departureAirport: { $in: departureAirportIds },
        arrivalAirport: { $in: arrivalAirportIds },
        departureTime: { $gte: dateRange.startDate, $lt: dateRange.endDate }
    }).populate({
        path: 'departureAirport',
        populate: { path: 'city' }
    }).populate({
        path: 'arrivalAirport',
        populate: { path: 'city' }
    });
};

const formatFlightsResponse = (flights) => {
    return flights.map(flight => ({
        ...flight._doc,
        departureAirport: flight.departureAirport.city.name,
        arrivalAirport: flight.arrivalAirport.city.name
    }));
};

const validateCitiesAndAirports = async (firstSearch, secondSearch) => {
    const departureCitiesIds = await getCityIdsByName(firstSearch);
    const arrivalCitiesIds = await getCityIdsByName(secondSearch);

    if (departureCitiesIds.length === 0 || arrivalCitiesIds.length === 0) {
        const error = new Error('No cities found with the given search terms.');
        error.statusCode = 404;
        throw error;
    }

    const departureAirportsIds = await getAirportIdsByCityIds(departureCitiesIds);
    const arrivalAirportsIds = await getAirportIdsByCityIds(arrivalCitiesIds);

    if (departureAirportsIds.length === 0 || arrivalAirportsIds.length === 0) {
        const error = new Error('No airports found in the specified cities.');
        error.statusCode = 404;
        throw error;
    }

    return { departureAirportsIds, arrivalAirportsIds };
};

const getFlightsInDateRange = async (departureAirportsIds, arrivalAirportsIds, date) => {
    const timezone = 'Asia/Damascus';
    
    const startDate = moment.tz(date, timezone).startOf('day').format();
    const endDate = moment.tz(date, timezone).endOf('day').format();

    const flights = await getFlights(departureAirportsIds, arrivalAirportsIds, { startDate, endDate });

    if (flights.length === 0) {
        const error = new Error('No flights found matching the search criteria.');
        error.statusCode = 404;
        throw error;
    }

    return formatFlightsResponse(flights);
};


const getAvailableRooms = async (hotelId,roomClass, startDate, endDate) => {
    const query = { hotel: hotelId, isAvailable: true };

    if (roomClass) {
        query.roomClass = roomClass;
    }

    const rooms = await Room.find(query);
    const availableRooms = [];

    for (let room of rooms) {
        const bookingRooms = await RoomBooking.find({
            room: room._id,
            $or: [
                { checkInDate: { $lt: endDate }, checkOutDate: { $gt: startDate } },
                { checkInDate: { $gte: startDate, $lt: endDate } },
                { checkOutDate: { $gt: startDate, $lte: endDate } }
            ]
        });

        if (bookingRooms.length === 0) {
            availableRooms.push(room);
        }
    }

    return availableRooms;
};


exports.getFlightsAndHotelsBySearch = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            const error = new Error(errors.array()[0].msg)
            error.statusCode=422;
            throw error;
        }

        let { trips , numberOfRooms , isAcceptPets ,roomClass } = req.body;
        const responseData = { flights: [], returnFlights: [],hotels:[] };
        for (let trip of trips) {
            let { firstSearch, secondSearch, departureDate, returnDate ,seatClass , numberOfAdults , numberOfChildrens} = trip;
            firstSearch = firstSearch.trim().toLowerCase()
            secondSearch = secondSearch.trim().toLowerCase()
            seatClass = seatClass.trim().toLowerCase()
            const numberOfPassengers = numberOfAdults + numberOfChildrens
            const { departureAirportsIds, arrivalAirportsIds } = await validateCitiesAndAirports(firstSearch, secondSearch);
            const flightsWithAirports = await getFlightsInDateRange(departureAirportsIds, arrivalAirportsIds, departureDate);
            for (let i = 0; i < flightsWithAirports.length; i++) {
                const flight = flightsWithAirports[i];
                
                const seats = await Seat.find({
                    flight: flight._id,
                    seatClass: seatClass,
                    isAvailable: true
                });
                
                if (seats.length <= numberOfPassengers) {
                    flightsWithAirports.splice(i, 1);
                    i--;
                }
            }
            if (flightsWithAirports.length === 0) {
                const error = new Error('No flights found matching the search criteria.');
                error.statusCode = 404;
                throw error;
            }        
            responseData.flights.push(...flightsWithAirports);
            const { departureAirportsIds: returnDepartureAirportsIds, arrivalAirportsIds: returnArrivalAirportsIds } = await validateCitiesAndAirports(secondSearch, firstSearch);
            const returnFlightsWithAirports = await getFlightsInDateRange(returnDepartureAirportsIds, returnArrivalAirportsIds, returnDate);            
            for (let i = 0; i < returnFlightsWithAirports.length; i++) {
                const flight = returnFlightsWithAirports[i];
                
                const seats = await Seat.find({
                    flight: flight._id,
                    seatClass: seatClass,
                    isAvailable: true
                });
                if (seats.length <= numberOfPassengers) {
                    returnFlightsWithAirports.splice(i, 1);
                    i--;
                }
            }            
            if (returnFlightsWithAirports.length === 0) {
                const error = new Error('No flights found matching the search criteria.');
                error.statusCode = 404;
                throw error;
            }
            responseData.returnFlights.push(...returnFlightsWithAirports);
            
            
            let checkInDate = trip.departureDate 
            let checkOutDate = trip.returnDate 

            numberOfRooms = numberOfRooms || 1; 
            const startDate = new Date(checkInDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(checkOutDate);
            endDate.setHours(23, 59, 59, 999);


            const citiesIds = await getCityIdsByName(secondSearch);

            
            if (citiesIds.length === 0) {
                const error = new Error('No cities found with the given search terms.');
                error.statusCode = 404;
                throw error;
            }


            const hotels = await Hotel.find({ city: { $in: citiesIds } , isAcceptPets:isAcceptPets }).populate('city');

            
            if (hotels.length === 0) {
                const error = new Error('No hotels found in the specified cities.');
                error.statusCode = 404;
                throw error;
            }

            for (let hotel of hotels) {
                const availableRooms = await getAvailableRooms(hotel._id , roomClass, startDate, endDate);
    
                if (availableRooms.length >= numberOfRooms) {
                    responseData.hotels.push({
                            ...hotel._doc,
                            city: hotel.city.name,
                            rooms: availableRooms
                        
                    });
                }
            }
    
            if (responseData.hotels.length === 0) {
                const error = new Error('No hotels with the required number of available rooms found.');
                error.statusCode = 404;
                throw error;
            }
        }
        
        res.status(200).json({ message: "Found", responseData });        
    }catch (err) {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
    }
};



const getAvailableSeats = async (flightId) => {
    try {
        const flight = await Flight.findById(flightId)
            .populate({
                path: 'departureAirport',
                populate: { path: 'city' }
            })
            .populate({
                path: 'arrivalAirport',
                populate: { path: 'city' }
            });

        if (!flight) {
            const error = new Error("Couldn't find the flight");
            error.statusCode = 422;
            throw error;
        }

        const seats = await Seat.find({ flight: flightId });

        if (seats.length === 0) {
            const error = new Error("Couldn't find any seats");
            error.statusCode = 422;
            throw error;
        }

        return {
            
            ...flight._doc,
            departureAirport: flight.departureAirport.city.name,
            arrivalAirport: flight.arrivalAirport.city.name
            ,
            seats
        };
    } catch (err) {
        throw new Error(`Error in getting available seats: ${err.message}`);
    }
};



exports.getAvailable = async (req, res, next) => {
    try {
        let { flightId, returnFlightId ,hotelId,roomClass} = req.body;

        if (!flightId || !returnFlightId || !hotelId) {
            const error = new Error("Flight ID , Return Flight ID and Hotel ID are required");
            error.statusCode = 400;
            throw error;
        }

        const [currFlightInfo, currReturnFlight] = await Promise.all([
            getAvailableSeats(flightId),
            getAvailableSeats(returnFlightId)
        ]);

        const startDate = new Date(currFlightInfo.departureTime);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(currReturnFlight.departureTime);
        endDate.setHours(23, 59, 59, 999);

        const currHotel =await Hotel.findById(hotelId)
        if (!currHotel) {
            const error = new Error("Couldn't find any hotel");
            error.statusCode = 422;
            throw error;
        }
        
        const availableRooms = await getAvailableRooms(hotelId, roomClass,startDate, endDate);
        
        if (!availableRooms || availableRooms.length === 0) {
            const error = new Error("Couldn't find any room");
            error.statusCode = 422;
            throw error;
        }


        res.status(200).json({
            message: "Fetched",
            currFlightInfo,
            currReturnFlight,
            hotelInfo : {
                ...currHotel._doc,
                rooms: availableRooms
            }
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};


exports.bookPackage=async (req,res,next)=>{
    try{
        const userId = req.userId
        const { hotelId , roomIds, numberOfRooms ,flightId , seatIds ,returnFlightId , returnSeatIds ,numberOfAdults , numberOfChildrens } = req.body

        const totalPassengers = seatIds.length

        const currFlight = await Flight.findById(flightId);
        if (!currFlight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        let finalPrice = 0;
        let good = true
        
        for (let seatId of seatIds) {
            const currSeat = await Seat.findById(seatId);
            if (!currSeat) {
                good = false
                return res.status(404).json({ message: `Seat ${seatId} not found` });
            }
            if (!currSeat.isAvailable) {
                good = false
                return res.status(400).json({ message: 'Unavailable seat' });
            }
 
            switch (currSeat.seatClass) {
                case 'economy':
                    finalPrice += currFlight.price;
                    break;
                case 'business':
                    finalPrice += currFlight.price * 1.1;
                    break;
                case 'first':
                    finalPrice += currFlight.price * 1.2;
                    break;
                default:
                    good = false
                    return res.status(400).json({ message: 'Invalid seat class' });
            }
        }
        const flightBooking = new FlightBooking({
            user: userId,
            flight: flightId,
            bookingDate: Date.now(),
            numberOfAdults:totalPassengers,
            numberOfChildrens:0,
            seatNumbers: seatIds,
            price: finalPrice,
        });


        // return flight 
        let returnFinalPrice = 0
        const totalReturnPassengers =returnSeatIds.length
        const currReturnFlight = await Flight.findById(returnFlightId);
        
        if (!currReturnFlight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        for (let seatId of returnSeatIds) {
            const currSeat = await Seat.findById(seatId);
            if (!currSeat) {
                good = false
                return res.status(404).json({ message: `Seat ${seatId} not found` });
            }
            if (!currSeat.isAvailable) {
                good = false
                return res.status(400).json({ message: 'Unavailable seat' });
            }
 
            switch (currSeat.seatClass) {
                case 'economy':
                    returnFinalPrice += currReturnFlight.price;
                    break;
                case 'business':
                    returnFinalPrice += currReturnFlight.price * 1.1;
                    break;
                case 'first':
                    returnFinalPrice += currReturnFlight.price * 1.2;
                    break;
                default:
                    good = false
                    return res.status(400).json({ message: 'Invalid seat class' });
            }
        }
        const returnFlightBooking = new FlightBooking({
            user: userId,
            flight: returnFlightId,
            bookingDate: Date.now(),
            numberOfAdults:totalReturnPassengers,
            numberOfChildrens:0,
            seatNumbers: returnSeatIds,
            price: returnFinalPrice,
        });

        // hotel 

        const startDate = new Date(currFlight.departureTime);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(currReturnFlight.departureTime);
        endDate.setHours(23, 59, 59, 999);
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const numberOfDays = Math.ceil((endDate - startDate) / millisecondsPerDay);

        const currHotel = await Hotel.findById(hotelId).populate('city');
        if (!currHotel) {
            good = false
            return res.status(404).json({ message: 'Hotel not found' });
        }
        const pricePerNight = currHotel.pricePerNight;

        // Check availability for each room
        const availableRoomIds = [];
        for (const roomId of roomIds) {
            const isAvailable = await checkRoomAvailability(roomId, startDate, endDate);
            if (isAvailable) {
                availableRoomIds.push(roomId);
            }
        }

        if (availableRoomIds.length < numberOfRooms) {
            good = false
            return res.status(404).json({ message: 'Not enough available rooms' });
        }

        let hotelFinalPrice = 0;
        const roomNumbers = [];
        
        for (const roomId of availableRoomIds) {
            const hotelRoom = await Room.findById(roomId);
            if (!hotelRoom || !hotelRoom.isAvailable) {
                good = false
                return res.status(400).json({ message: `Room ${roomId} is either not found or unavailable` });
            }

            const roomPrice = calculateRoomPrice(pricePerNight, hotelRoom.roomClass);
            hotelFinalPrice += roomPrice * numberOfDays;
            roomNumbers.push(hotelRoom._id);
        }
        // Create hotel booking
        const hotelBooking = new HotelBooking({
            user: userId,
            hotel: currHotel._id,
            roomNumbers:roomNumbers,
            bookingDate: Date.now(),
            checkInDate:startDate,
            checkOutDate:endDate,
            numberOfRooms:numberOfRooms,
            numberOfAdults :numberOfAdults ,
            numberOfChildrens :numberOfChildrens  ,
            price: hotelFinalPrice
        });


        if(good){        
            for (let seatId of seatIds) {
                await Seat.findByIdAndUpdate(seatId, { isAvailable: false }, { new: true });
                
            }
            for (let seatId of returnSeatIds) {
                await Seat.findByIdAndUpdate(seatId, { isAvailable: false }, { new: true });
                
            }
            
            await Promise.all(availableRoomIds.map(async (roomId) => {
                const hotelRoomBooking = new RoomBooking({
                    room:roomId,
                    checkInDate:startDate,
                    checkOutDate:endDate
                });
                await hotelRoomBooking.save();
            }));
    
            
            const newHotelBooking = await hotelBooking.save();
            const newFlightBooking = await returnFlightBooking.save()
            const newReturnBooking = await flightBooking.save();

            
            finalPrice = hotelFinalPrice + returnFinalPrice + finalPrice
            res.status(200).json({ message: "Found",finalPrice : finalPrice,flightBookingId:newFlightBooking._id ,returnFlightBookingId:newReturnBooking._id ,hotelBookingId:newHotelBooking._id  });   
        }else{
            res.status(400).json({ message:"Error"})
        }




        
    }catch (err) {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
    }

}



// Helper function to calculate room price
const calculateRoomPrice = (pricePerNight, roomClass) => {
    const priceMultipliers = {
        delux: 1.2,
        suit: 1.5,
        king: 2
    };
    return pricePerNight * (priceMultipliers[roomClass] || 1);
};

// Helper function to check room availability
const checkRoomAvailability = async (roomId, startDate, endDate) => {
    const bookingConflict = await RoomBooking.findOne({
        room: roomId,
        $or: [
            { checkInDate: { $lt: endDate }, checkOutDate: { $gt: startDate } },
            { checkInDate: { $gte: startDate, $lt: endDate } },
            { checkOutDate: { $gt: startDate, $lte: endDate } }
        ]
    });
    return !bookingConflict;
};