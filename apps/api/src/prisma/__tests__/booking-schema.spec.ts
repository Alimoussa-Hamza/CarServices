import {
  BookingActorType,
  BookingPhotoType,
  BookingPhotoUploader,
  BookingStatus,
  VehicleType,
} from '@prisma/client';
import {
  BookingActorTypeSchema,
  BookingPhotoTypeSchema,
  BookingPhotoUploaderSchema,
  BookingStatusSchema,
  VehicleTypeSchema,
} from '@carservice/shared-types';

describe('Prisma booking schema', () => {
  it('aligne BookingStatus sur shared-types (RG-BOOK)', () => {
    expect(Object.values(BookingStatus).sort()).toEqual(
      [...BookingStatusSchema.options].sort(),
    );
  });

  it('aligne BookingActorType sur shared-types', () => {
    expect(Object.values(BookingActorType).sort()).toEqual(
      [...BookingActorTypeSchema.options].sort(),
    );
  });

  it('aligne BookingPhotoType sur shared-types', () => {
    expect(Object.values(BookingPhotoType).sort()).toEqual(
      [...BookingPhotoTypeSchema.options].sort(),
    );
  });

  it('aligne BookingPhotoUploader sur shared-types', () => {
    expect(Object.values(BookingPhotoUploader).sort()).toEqual(
      [...BookingPhotoUploaderSchema.options].sort(),
    );
  });

  it('aligne VehicleType sur shared-types', () => {
    expect(Object.values(VehicleType).sort()).toEqual(
      [...VehicleTypeSchema.options].sort(),
    );
  });
});
