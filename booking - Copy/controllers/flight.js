const { validationResult } =require('express-validator')
const moment = require('moment-timezone');

const Airport = require('../models/flight/airport');
const Flight = require('../models/flight/flight');
const FavoriteFlight = require('../models/flight/favoriteFlight');
const Seat = require('../models/flight/seat');
const City = require('../models/city');
const FlightBooking = require('../models/flight/flightBooking')

// Helper function to calculate seat price
exports.bookFlight = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { flightId } = req.params;
        const { numberOfAdults, numberOfChildrens, seatIds } = req.body;

        const totalPassengers = numberOfAdults + numberOfChildrens;
        if (totalPassengers !== seatIds.length) {
            return res.status(400).json({ message: 'The number of seats doesn\'t match the number of people' });
        }

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

        if(good){
            for (let seatId of seatIds) {
                await Seat.findByIdAndUpdate(seatId, { isAvailable: false }, { new: true });
            }
        }

        const flightBooking = new FlightBooking({
            user: userId,
            flight: flightId,
            bookingDate: Date.now(),
            numberOfAdults:numberOfAdults,
            numberOfChildrens:numberOfChildrens,
            seatNumbers: seatIds,
            price: finalPrice,
        });

        await flightBooking.save();
        res.status(200).json({ message: 'Success' , bookingId : flightBooking._id });
    } catch (err) {
        err.statusCode = err.statusCode || 500;
        next(err);
    }
};

exports.getFlightsDependensOnVibe = async (req, res, next) => {
    try {
        const { vibe } = req.query;
        const userId = req.userId;

        // Fetch specific airports based on the vibe
        const specificAirports = await Airport.aggregate([
            {
                $lookup: {
                    from: 'cities',
                    localField: 'city',
                    foreignField: '_id',
                    as: 'city'
                }
            },
            { $unwind: '$city' },
            { $match: { 'city.vibe': vibe } },
            { $sample: { size: 6 } }
        ]);

        if (specificAirports.length === 0) {
            return res.status(404).json({ message: 'No airports found in the specified vibe' });
        }

        const airportIds = specificAirports.map(airport => airport._id);

        // Fetch specific flights to the fetched airports
        const specificFlights = await Flight.aggregate([
            { $match: { arrivalAirport: { $in: airportIds } } },
            { $sample: { size: 5 } }
        ]);

        if (specificFlights.length === 0) {
            return res.status(404).json({ message: 'No flights found to the specified airports' });
        }

        // Populate the flight data with city names for departure and arrival airports
        let populatedFlights = await Flight.populate(specificFlights, [
            { path: 'departureAirport', populate: { path: 'city' } },
            { path: 'arrivalAirport', populate: { path: 'city' } }
        ]);

        // Check if flights are in user's favorites
        const flightsWithFavorites = await Promise.all(populatedFlights.map(async flight => {
            const favorite = await FavoriteFlight.findOne({
                user: userId,
                flight: flight._id
            });
            if(!favorite){
                return {
                    ...flight,
                    isFavorite: false
                };
            }else{
                return {
                    ...flight,
                    isFavorite: true
                };
            }
        }));

        // Map flights to include city names
        const flightsWithAirports = flightsWithFavorites.map(flight => ({
            ...flight,
            departureAirport: flight.departureAirport.city?.name || 'Unknown',
            arrivalAirport: flight.arrivalAirport.city?.name || 'Unknown'
        }));

        return res.status(200).json({ message: 'Found', flights: flightsWithAirports });
    } catch (err) {
        err.statusCode = err.statusCode || 500;
        next(err);
    }
};



exports.getTrendingFlights=async (req,res,next)=>{
    try{
        const userId = req.userId
        const flights = await Flight.aggregate([
            { $sample: { size: 6 } }
        ]);
        
        const populatedFlights = await Flight.populate(flights, [
            { path: 'departureAirport', populate: { path: 'city' } },
            { path: 'arrivalAirport', populate: { path: 'city' } }
        ]);

        // Check if flights are in user's favorites
        const flightsWithFavorites = await Promise.all(populatedFlights.map(async flight => {
            const favorite = await FavoriteFlight.findOne({
                user: userId,
                flight: flight._id
            });
            if(!favorite){
                return {
                    ...flight,
                    isFavorite: false
                };
            }else{
                return {
                    ...flight,
                    isFavorite: true
                };
            }
        }));

        const flightsWithAirports = flightsWithFavorites.map(flight => {
            return {
                ...flight,
                departureAirport: flight.departureAirport.city.name,
                arrivalAirport: flight.arrivalAirport.city.name
            };
        });

        res.status(200).json({ message: "Found", flights: flightsWithAirports });

    }catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getFlightsDependensOnContinent = async (req, res, next) => {
    try {
        const userId = req.userId
        const { continent } = req.query;

        // Fetch specific airports on the specified continent
        const specificAirports = await Airport.aggregate([
            {
                $lookup: {
                    from: 'cities',
                    localField: 'city',
                    foreignField: '_id',
                    as: 'city'
                }
            },
            { $unwind: '$city' },
            { $match: { 'city.continent': continent } },
            { $sample: { size: 6 } }
        ]);

        if (specificAirports.length === 0) {
            return res.status(404).json({ message: 'No airports found in the specified continent' });
        }

        const airportIds = specificAirports.map(airport => airport._id);

        // Fetch specific flights to the fetched airports
        const specificFlights = await Flight.aggregate([
            { $match: { arrivalAirport: { $in: airportIds } } },
            { $sample: { size: 5 } }
        ]);

        if (specificFlights.length === 0) {
            return res.status(404).json({ message: 'No flights found to the specified airports' });
        }

        // Populate the flight data with city names for departure and arrival airports
        const populatedFlights = await Flight.populate(specificFlights, [
            { path: 'departureAirport', populate: { path: 'city' } },
            { path: 'arrivalAirport', populate: { path: 'city' } }
        ]);


        const flightsWithFavorites = await Promise.all(populatedFlights.map(async flight => {
            const favorite = await FavoriteFlight.findOne({
                user: userId,
                flight: flight._id
            });
            if(!favorite){
                return {
                    ...flight,
                    isFavorite: false
                };
            }else{
                return {
                    ...flight,
                    isFavorite: true
                };
            }
        }));
        

        // Map flights to include city names
        const flightsWithAirports = flightsWithFavorites.map(flight => ({
            ...flight,
            departureAirport: flight.departureAirport.city?.name || 'Unknown',
            arrivalAirport: flight.arrivalAirport.city?.name || 'Unknown'
        }));

        return res.status(200).json({ message: 'Found', flights: flightsWithAirports });
    } catch (err) {
        err.statusCode = err.statusCode || 500;
        next(err);
    }
};

exports.getAvailableSeats=async (req,res,next)=>{
    try{
        const flightId = req.params.flightId;
        const flight = await Flight.findById(flightId).populate({
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

        const seats = await Seat.find({$and:[
                {flight: flightId}
            ]  
        });

        if (seats.length === 0) {
            const error = new Error("Couldn't find any seat");
            error.statusCode = 422;
            throw error;
        }

        res.status(200).json({ message: "Fetched",flight : {...flight._doc,
            departureAirport: flight.departureAirport.city.name,
            arrivalAirport: flight.arrivalAirport.city.name} ,seats: seats });

    }catch(err){
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}


exports.getFavoriteFlights = async (req, res, next) => {
    try {
        const favoriteFlights = await FavoriteFlight.find({ user: req.userId });
        
        const flightsIds = favoriteFlights.map(favoriteFlight => favoriteFlight.flight);

        let flights = await Flight.find(
            { _id: { $in: flightsIds } }
        ).populate({
            path: 'departureAirport',
            populate: { path: 'city' }
        })
        .populate({
            path: 'arrivalAirport',
            populate: { path: 'city' }
        });

        if (!flights || flights.length === 0) {
            const error = new Error("Couldn't find any favorite flight");
            error.statusCode = 422;
            throw error;
        }
        const flightsWithAirports = flights.map(flight => {
            return {
                ...flight._doc,
                departureAirport: flight.departureAirport.city.name,
                arrivalAirport: flight.arrivalAirport.city.name
            };
        });
        res.status(200).json({ message: "Fetched", flights: flightsWithAirports });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};


exports.addFavoriteFlight = async (req, res, next) => {
    try {
        const flightId = req.params.flightId;
        const flight = await Flight.findById(flightId);
        
        if (!flight) {
            const error = new Error("Couldn't find the flight");
            error.statusCode = 422;
            throw error;
        }
        
        const favoriteFlight = new FavoriteFlight({
            user: req.userId,
            flight: flightId
        });
        await favoriteFlight.save();
        
        res.status(200).json({ message: "Added" });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};


exports.deleteFavoriteFlight = async (req, res, next) => {
    try {
        const flightId = req.params.flightId;
        const favoriteFlight = await FavoriteFlight.findOneAndDelete({
            flight: flightId,
            user: req.userId
        });
        
        if (!favoriteFlight) {
            const error = new Error("Couldn't find the flight");
            error.statusCode = 422;
            throw error;
        }
        
        res.status(200).json({ message: "Deleted" });
    }catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};





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

exports.getFlightsBySearch = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            const error = new Error(errors.array()[0].msg)
            error.statusCode=422;
            throw error;
        }

        const { trips } = req.body;
        const responseData = { flights: [], returnFlights: [] };

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
            
            if (returnDate) {
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