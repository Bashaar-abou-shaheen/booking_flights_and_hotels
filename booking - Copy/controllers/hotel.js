const { validationResult } =require('express-validator');

const Hotel = require('../models/hotel/hotel');
const FavoriteHotel = require('../models/hotel/favoriteHotel');
const Room = require('../models/hotel/hotelRoom')
const City = require('../models/city');
const RoomBooking = require('../models/hotel/hotelRoomBooking');
const HotelBooking = require('../models/hotel/hotelBooking');


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

// bookHotel Function
exports.bookHotel = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { hotelId } = req.params;
        const { roomIds, checkInDate, checkOutDate, numberOfRooms, numberOfAdults, numberOfChildrens } = req.body;

        const startDate = new Date(checkInDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(checkOutDate);
        endDate.setHours(23, 59, 59, 999);
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const numberOfDays = Math.ceil((endDate - startDate) / millisecondsPerDay);

        const currHotel = await Hotel.findById(hotelId).populate('city');
        if (!currHotel) {
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
            return res.status(404).json({ message: 'Not enough available rooms' });
        }

        // Calculate total price and gather room numbers
        let finalPrice = 0;
        const roomNumbers = [];

        for (const roomId of availableRoomIds) {
            const hotelRoom = await Room.findById(roomId);
            if (!hotelRoom || !hotelRoom.isAvailable) {
                return res.status(400).json({ message: `Room ${roomId} is either not found or unavailable` });
            }

            const roomPrice = calculateRoomPrice(pricePerNight, hotelRoom.roomClass);
            finalPrice += roomPrice * numberOfDays;
            roomNumbers.push(hotelRoom._id);
        }

        // Save room bookings
        await Promise.all(availableRoomIds.map(async (roomId) => {
            const hotelRoomBooking = new RoomBooking({
                room: roomId,
                checkInDate,
                checkOutDate
            });
            await hotelRoomBooking.save();
        }));

        // Create hotel booking
        const hotelBooking = new HotelBooking({
            user: userId,
            hotel: currHotel._id,
            roomNumbers,
            bookingDate: Date.now(),
            checkInDate,
            checkOutDate,
            numberOfRooms,
            numberOfAdults,
            numberOfChildrens,
            price: finalPrice
        });

        await hotelBooking.save();
        res.status(200).json({ message: 'Success', bookingId: hotelBooking._id });
    } catch (err) {
        err.statusCode = err.statusCode || 500;
        next(err);
    }
};

exports.getHotelssDependensOnCityName = async (req, res, next) => {
    try {
        const userId = req.userId
        const { city } = req.query;
        // Fetch specific hotels on the specified continent
        const specificHotels = await Hotel.aggregate([
            {
                $lookup: {
                    from: 'cities',
                    localField: 'city',
                    foreignField: '_id',
                    as: 'city'
                }
            },
            { $unwind: '$city' },
            { $match: { 'city.name': city } },
            { $sample: { size: 6 } }
        ]);

        if (specificHotels.length === 0) {
            return res.status(404).json({ message: 'No hotels found in the specified city' });
        }

        

        const hotelsWithFavorites = await Promise.all(specificHotels.map(async hotel => {
            const favorite = await FavoriteHotel.findOne({
                user: userId,
                hotel: hotel._id
            });
            if(!favorite){
                return {
                    ...hotel,
                    isFavorite: false
                };
            }else{
                return {
                    ...hotel,
                    isFavorite: true
                };
            }
        }));

        // Map hotels to include city names and country names
        const hotelsWithCities = hotelsWithFavorites.map(hotel => ({
            ...hotel,
            city : hotel.city?.name || 'Unknown',
            country : hotel.city?.country || 'Unknown'
        }));

        return res.status(200).json({ message: 'Found', hotels: hotelsWithCities });
    } catch (err) {
        err.statusCode = err.statusCode || 500;
        next(err);
    }
};


exports.getHotelsDependensOnVibe = async (req, res, next) => {
    try {
        const userId = req.userId
        const { vibe } = req.query;

        // Fetch specific hotels based on the vibe
        const specificHotels = await Hotel.aggregate([
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

        
        if (specificHotels.length === 0) {
            return res.status(404).json({ message: 'No hotels found to the specified vibe' });
        }

        const hotelsWithFavorites = await Promise.all(specificHotels.map(async hotel => {
            const favorite = await FavoriteHotel.findOne({
                user: userId,
                hotel: hotel._id
            });
            if(!favorite){
                return {
                    ...hotel,
                    isFavorite: false
                };
            }else{
                return {
                    ...hotel,
                    isFavorite: true
                };
            }
        }));


        // Map hotels to include city names
        const hotelsWithCities = hotelsWithFavorites.map(hotel => ({
            ...hotel,
            city : hotel.city?.name || 'Unknown',
            country : hotel.city?.country || 'Unknown'
        }));

        return res.status(200).json({ message: 'Found', flights: hotelsWithCities });
    } catch (err) {
        err.statusCode = err.statusCode || 500;
        next(err);
    }
};



exports.getTrendingHotels=async (req,res,next)=>{
    try{
        const userId = req.userId
        const hotels = await Hotel.aggregate([
            { $sample: { size: 6 } }
        ]);
        
        const populatedHotels = await Hotel.populate(hotels, [
            { path: 'city' }
        ]);

        const hotelsWithFavorites = await Promise.all(populatedHotels.map(async hotel => {
            const favorite = await FavoriteHotel.findOne({
                user: userId,
                hotel: hotel._id
            });
            if(!favorite){
                return {
                    ...hotel,
                    isFavorite: false
                };
            }else{
                return {
                    ...hotel,
                    isFavorite: true
                };
            }
        }));


        const hotelsWithCities = hotelsWithFavorites.map(hotel => {
            return {
                ...hotel,
                city: hotel.city.name,
                country: hotel.city.country
            };
        });

        res.status(200).json({ message: "Found", hotels: hotelsWithCities });

    }catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}


exports.getHotelssDependensOnContinent = async (req, res, next) => {
    try {
        const userId = req.userId
        const { continent } = req.query;
        // Fetch specific hotels on the specified continent
        const specificHotels = await Hotel.aggregate([
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

        if (specificHotels.length === 0) {
            return res.status(404).json({ message: 'No hotels found in the specified continent' });
        }

        const hotelsWithFavorites = await Promise.all(specificHotels.map(async hotel => {
            const favorite = await FavoriteHotel.findOne({
                user: userId,
                hotel: hotel._id
            });
            if(!favorite){
                return {
                    ...hotel,
                    isFavorite: false
                };
            }else{
                return {
                    ...hotel,
                    isFavorite: true
                };
            }
        }));

        // Map hotels to include city names and country names
        const hotelsWithCities = hotelsWithFavorites.map(hotel => ({
            ...hotel,
            city : hotel.city?.name || 'Unknown',
            country : hotel.city?.country || 'Unknown'
        }));

        return res.status(200).json({ message: 'Found', hotels: hotelsWithCities });
    } catch (err) {
        err.statusCode = err.statusCode || 500;
        next(err);
    }
};



exports.getAvailableRooms=async (req,res,next)=>{
    try{
        const hotelId = req.params.hotelId;
        
        let { checkInDate , checkOutDate ,roomClass} = req.body
        
        if(!checkInDate && !checkOutDate){
            checkInDate = Date.now()
            checkOutDate = Date.now()
            const oneDayInMillis = 24 * 60 * 60 * 1000; 
            checkOutDate = checkOutDate + oneDayInMillis;
            checkOutDate= new Date(checkOutDate);
        }

        
        const startDate = new Date(checkInDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(checkOutDate);
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

        res.status(200).json({ message: "Fetched",hotel:currHotel ,rooms: availableRooms });

    }catch(err){
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.deleteFavoriteHotel = async (req, res, next) => {
    try {
        const hotelId = req.params.hotelId;
        const favoriteHotel = await FavoriteHotel.findOneAndDelete({
            hotel: hotelId,
            user: req.userId
        });
        
        if (!favoriteHotel) {
            const error = new Error("Couldn't find the hotel");
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


exports.getFavoriteHotels = async (req, res, next) => {
    try {
        const favoriteHotels = await FavoriteHotel.find({ user: req.userId });

        const hotelsIds = favoriteHotels.map(favoriteHotel => favoriteHotel.hotel);
        
        let hotels = await Hotel.find({ _id: { $in: hotelsIds } }).populate('city')

        if (!hotels || hotels.length === 0) {
            const error = new Error("Couldn't find any favorite hotel");
            error.statusCode = 422;
            throw error;
        }
         
        const hotelsWithCities = hotels.map(hotel=>{
            return {
                ...hotel._doc,
                city : hotel.city.name
            }
        })
        res.status(200).json({ message: "Fetched", hotels: hotelsWithCities });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};


exports.addFavoriteHotel = async (req, res, next) => {
    try {
        const hotelId = req.params.hotelId;
        const hotel = await Hotel.findById(hotelId);
        
        if (!hotel) {
            const error = new Error("Couldn't find the hotel");
            error.statusCode = 422;
            throw error;
        }
        
        const favoriteHotel = new FavoriteHotel({
            user: req.userId,
            hotel: hotelId
        });
        await favoriteHotel.save();
        
        res.status(200).json({ message: "Added" });
    } catch (err) {
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

exports.getHotelsBySearch = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error(errors.array()[0].msg);
            error.statusCode = 422;
            throw error;
        }

        let { city, checkInDate, checkOutDate, numberOfRooms , isAcceptPets ,roomClass} = req.body;
        numberOfRooms = numberOfRooms || 1; 

        const startDate = new Date(checkInDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(checkOutDate);
        endDate.setHours(23, 59, 59, 999);

        const citiesIds = await getCityIdsByName(city);
        if (citiesIds.length === 0) {
            const error = new Error('No cities found with the given search terms.');
            error.statusCode = 404;
            throw error;
        }

        const hotels = await Hotel.find({ city: { $in: citiesIds , } , isAcceptPets:isAcceptPets }).populate('city');
        if (hotels.length === 0) {
            const error = new Error('No hotels found in the specified cities.');
            error.statusCode = 404;
            throw error;
        }

        const responseData = [];

        for (let hotel of hotels) {
            const availableRooms = await getAvailableRooms(hotel._id , roomClass, startDate, endDate);

            if (availableRooms.length >= numberOfRooms) {
                responseData.push({
                        ...hotel._doc,
                        city: hotel.city.name,
                        rooms: availableRooms
                    
                });
            }
        }

        if (responseData.length === 0) {
            const error = new Error('No hotels with the required number of available rooms found.');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ message: "Found", hotels: responseData });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};