import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const parseFloatValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseIntValue = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
};

const REQUIRED_CREATE_FIELDS = [
  'title',
  'description',
  'address',
  'city',
  'state',
  'zipCode',
  'hospitalName',
  'distanceToHospital',
  'listingType',
  'roomType',
  'availableFrom',
  'availableTo',
  'rotationLength'
];

export const createListing = async (req, res) => {
  try {
    const missingFields = REQUIRED_CREATE_FIELDS.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const distance = parseFloatValue(req.body.distanceToHospital);
    if (distance === null || distance < 0) {
      return res.status(400).json({ error: 'Invalid distance to hospital' });
    }

    const availableFrom = parseDateValue(req.body.availableFrom);
    const availableTo = parseDateValue(req.body.availableTo);

    if (!availableFrom || !availableTo) {
      return res.status(400).json({ error: 'Invalid availability dates' });
    }

    if (availableFrom > availableTo) {
      return res.status(400).json({ error: 'Available from date must be before available to date' });
    }

    const listingType = req.body.listingType;
    const price = listingType === 'SWAP_ONLY' ? null : parseFloatValue(req.body.pricePerMonth);

    if (listingType !== 'SWAP_ONLY' && price === null) {
      return res.status(400).json({ error: 'Invalid monthly price' });
    }

    const maxGuests = Math.max(parseIntValue(req.body.maxGuests, 1) || 1, 1);

    const listing = await prisma.listing.create({
      data: {
        userId: req.user.id,
        title: req.body.title.trim(),
        description: req.body.description.trim(),
        address: req.body.address.trim(),
        city: req.body.city.trim(),
        state: req.body.state.trim().toUpperCase(),
        zipCode: req.body.zipCode.trim(),
        hospitalName: req.body.hospitalName.trim(),
        distanceToHospital: distance,
        listingType,
        roomType: req.body.roomType,
        pricePerMonth: price,
        availableFrom,
        availableTo,
        rotationLength: req.body.rotationLength,
        amenities: normalizeStringArray(req.body.amenities),
        photos: normalizeStringArray(req.body.photos),
        maxGuests
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            medicalSchool: true
          }
        }
      }
    });

    res.status(201).json(listing);
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
};

export const getListings = async (req, res) => {
  try {
    const {
      city,
      state,
      hospitalName,
      listingType,
      roomType,
      minPrice,
      maxPrice,
      availableFrom,
      availableTo,
      userId,
      page = 1,
      limit = 12
    } = req.query;

    const where = {
      isActive: true
    };

    if (userId) where.userId = userId;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = state.toUpperCase();
    if (hospitalName) where.hospitalName = { contains: hospitalName, mode: 'insensitive' };
    if (listingType) where.listingType = listingType;
    if (roomType) where.roomType = roomType;

    const minPriceValue = parseFloatValue(minPrice);
    const maxPriceValue = parseFloatValue(maxPrice);
    if (minPriceValue !== null || maxPriceValue !== null) {
      where.pricePerMonth = {};
      if (minPriceValue !== null) where.pricePerMonth.gte = minPriceValue;
      if (maxPriceValue !== null) where.pricePerMonth.lte = maxPriceValue;
    }

    const availableFromDate = parseDateValue(availableFrom);
    const availableToDate = parseDateValue(availableTo);

    if (availableFromDate) {
      where.availableFrom = { lte: availableFromDate };
    }

    if (availableToDate) {
      where.availableTo = { gte: availableToDate };
    }

    const pageNumber = Math.max(parseIntValue(page, 1) || 1, 1);
    const limitNumber = Math.min(Math.max(parseIntValue(limit, 12) || 12, 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              medicalSchool: true
            }
          }
        }
      }),
      prisma.listing.count({ where })
    ]);

    res.json({
      listings,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.max(Math.ceil(total / limitNumber), 1)
      }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

export const getListingById = async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            medicalSchool: true,
            graduationYear: true,
            bio: true
          }
        },
        bookings: {
          where: {
            status: 'APPROVED',
            checkOut: { gte: new Date() }
          },
          select: {
            checkIn: true,
            checkOut: true
          },
          orderBy: {
            checkIn: 'asc'
          }
        }
      }
    });

    if (!listing || !listing.isActive) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(listing);
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
};

export const updateListing = async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id }
    });

    if (!listing || !listing.isActive) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const data = {};

    if (req.body.title !== undefined) data.title = req.body.title.trim();
    if (req.body.description !== undefined) data.description = req.body.description.trim();
    if (req.body.address !== undefined) data.address = req.body.address.trim();
    if (req.body.city !== undefined) data.city = req.body.city.trim();
    if (req.body.state !== undefined) data.state = req.body.state.trim().toUpperCase();
    if (req.body.zipCode !== undefined) data.zipCode = req.body.zipCode.trim();
    if (req.body.hospitalName !== undefined) data.hospitalName = req.body.hospitalName.trim();

    if (req.body.distanceToHospital !== undefined) {
      const distance = parseFloatValue(req.body.distanceToHospital);
      if (distance === null || distance < 0) {
        return res.status(400).json({ error: 'Invalid distance to hospital' });
      }
      data.distanceToHospital = distance;
    }

    if (req.body.availableFrom !== undefined) {
      const availableFrom = parseDateValue(req.body.availableFrom);
      if (!availableFrom) {
        return res.status(400).json({ error: 'Invalid available from date' });
      }
      data.availableFrom = availableFrom;
    }

    if (req.body.availableTo !== undefined) {
      const availableTo = parseDateValue(req.body.availableTo);
      if (!availableTo) {
        return res.status(400).json({ error: 'Invalid available to date' });
      }
      data.availableTo = availableTo;
    }

    const effectiveAvailableFrom = data.availableFrom ?? listing.availableFrom;
    const effectiveAvailableTo = data.availableTo ?? listing.availableTo;

    if (effectiveAvailableFrom > effectiveAvailableTo) {
      return res.status(400).json({ error: 'Available from date must be before available to date' });
    }

    if (req.body.rotationLength !== undefined) {
      data.rotationLength = req.body.rotationLength;
    }

    if (req.body.listingType !== undefined) {
      data.listingType = req.body.listingType;
    }

    if (req.body.roomType !== undefined) {
      data.roomType = req.body.roomType;
    }

    if (req.body.amenities !== undefined) {
      data.amenities = normalizeStringArray(req.body.amenities);
    }

    if (req.body.photos !== undefined) {
      data.photos = normalizeStringArray(req.body.photos);
    }

    if (req.body.maxGuests !== undefined) {
      const maxGuests = Math.max(parseIntValue(req.body.maxGuests, listing.maxGuests) || listing.maxGuests, 1);
      data.maxGuests = maxGuests;
    }

    const listingType = data.listingType ?? listing.listingType;

    if (listingType === 'SWAP_ONLY') {
      data.pricePerMonth = null;
    } else if (req.body.pricePerMonth !== undefined) {
      const price = parseFloatValue(req.body.pricePerMonth);
      if (price === null) {
        return res.status(400).json({ error: 'Invalid monthly price' });
      }
      data.pricePerMonth = price;
    }

    if (req.body.isActive !== undefined) {
      data.isActive = Boolean(req.body.isActive);
    }

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            medicalSchool: true
          }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ error: 'Failed to update listing' });
  }
};

export const deleteListing = async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id }
    });

    if (!listing || !listing.isActive) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.listing.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
};
