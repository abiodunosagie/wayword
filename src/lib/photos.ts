// FILE: lib/photos.ts
// Photos for Snap: taken or picked, shrunk to what Claude reads best (1568 px on the long side),
// then kept in the app's own folder so each card can show where its word came from. Each account
// has its own folder, and re-encoding the photo drops its EXIF data (location included) before it
// is sent anywhere.
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const LONG_SIDE = 1568;

export type Prepared = { uri: string; base64: string };

export class PhotoError extends Error {}

function root(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  dir.create({ idempotent: true, intermediates: true });
  return dir;
}

/** Stored names are "<account>/<photo>.jpg", so one account's photos never sit beside another's. */
const fileFor = (name: string) => new File(root(), ...name.split('/'));

/** Opens the camera or the photo library. Null when the person cancels. */
export async function pickPhoto(source: 'camera' | 'library'): Promise<ImagePicker.ImagePickerAsset | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new PhotoError('Allow camera access in Settings to take a photo, or choose one instead.');
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: false };
  let result: ImagePicker.ImagePickerResult;
  try {
    result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  } catch {
    // The Simulator and some tablets have no camera.
    throw new PhotoError(source === 'camera' ? 'This device has no camera. Choose a photo instead.' : 'Could not open your photos.');
  }
  return result.canceled ? null : (result.assets[0] ?? null);
}

/** Shrinks the photo and encodes it for the request. */
export async function preparePhoto(asset: { uri: string; width: number; height: number }): Promise<Prepared> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > LONG_SIDE) {
    context.resize(asset.width >= asset.height ? { width: LONG_SIDE, height: null } : { width: null, height: LONG_SIDE });
  }
  const image = await context.renderAsync();
  try {
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.75, base64: true });
    if (!saved.base64) throw new PhotoError('Could not read that photo. Try another one.');
    return { uri: saved.uri, base64: saved.base64 };
  } finally {
    // Native image memory is not garbage collected with the JavaScript objects.
    image.release();
    context.release();
  }
}

/** Copies a prepared photo into the account's folder; returns the name to store. */
export function keepPhoto(uri: string, id: string, userId: string): string {
  const dir = new Directory(root(), userId);
  dir.create({ idempotent: true });
  const name = `${userId}/${id}.jpg`;
  const target = fileFor(name);
  if (target.exists) target.delete();
  new File(uri).copy(target);
  return name;
}

export function photoUri(name: string): string {
  return fileFor(name).uri;
}

/** Never throws: a photo that cannot be removed must not block deleting what it belongs to. */
export function deletePhoto(name: string): void {
  try {
    const file = fileFor(name);
    if (file.exists) file.delete();
  } catch {
    // Left on disk; it is inside the app's own sandbox and no row points at it any more.
  }
}
