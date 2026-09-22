package com.amanjantri.app;

import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "NativeJantri")
public class NativeJantriPlugin extends Plugin {

    @PluginMethod
    public void shareImage(PluginCall call) {
        try {
            String base64Data = call.getString("base64");
            String fileName = call.getString("fileName", "jantri.jpg");

            if (base64Data == null || base64Data.trim().isEmpty()) {
                call.reject("Base64 data is required");
                return;
            }

            if (base64Data.contains(",")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }

            byte[] imageBytes = Base64.decode(base64Data, Base64.DEFAULT);

            // Use app internal cache dir
            File cacheDir = getContext().getCacheDir();
            File shareDir = new File(cacheDir, "shared_jantri");
            if (!shareDir.exists()) {
                shareDir.mkdirs();
            }

            File imageFile = new File(shareDir, fileName);
            FileOutputStream fos = new FileOutputStream(imageFile);
            fos.write(imageBytes);
            fos.flush();
            fos.close();

            String authority = getContext().getPackageName() + ".fileprovider";
            Uri contentUri = FileProvider.getUriForFile(getContext(), authority, imageFile);

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("image/jpeg");
            shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
            shareIntent.putExtra(Intent.EXTRA_SUBJECT, fileName);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(shareIntent, "Share Jantri via");
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            getActivity().startActivity(chooser);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Share error: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void downloadImage(PluginCall call) {
        try {
            String base64Data = call.getString("base64");
            String fileName = call.getString("fileName", "jantri.jpg");

            if (base64Data == null || base64Data.trim().isEmpty()) {
                call.reject("Base64 data is required");
                return;
            }

            if (base64Data.contains(",")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }

            byte[] imageBytes = Base64.decode(base64Data, Base64.DEFAULT);
            boolean saved = false;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
                values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/AmanJantri");
                values.put(MediaStore.Images.Media.IS_PENDING, 1);

                Uri collection = MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                Uri itemUri = getContext().getContentResolver().insert(collection, values);

                if (itemUri != null) {
                    try (OutputStream os = getContext().getContentResolver().openOutputStream(itemUri)) {
                        if (os != null) {
                            os.write(imageBytes);
                            os.flush();
                        }
                    }
                    values.clear();
                    values.put(MediaStore.Images.Media.IS_PENDING, 0);
                    getContext().getContentResolver().update(itemUri, values, null, null);
                    saved = true;
                }
            } else {
                File picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
                File appDir = new File(picturesDir, "AmanJantri");
                if (!appDir.exists()) {
                    appDir.mkdirs();
                }
                File imageFile = new File(appDir, fileName);
                try (FileOutputStream fos = new FileOutputStream(imageFile)) {
                    fos.write(imageBytes);
                    fos.flush();
                }
                android.media.MediaScannerConnection.scanFile(
                    getContext(),
                    new String[]{imageFile.getAbsolutePath()},
                    new String[]{"image/jpeg"},
                    null
                );
                saved = true;
            }

            if (saved) {
                getActivity().runOnUiThread(() -> {
                    Toast.makeText(getContext(), "Jantri image saved to Gallery successfully!", Toast.LENGTH_LONG).show();
                });
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } else {
                call.reject("Could not save to media store");
            }
        } catch (Exception e) {
            call.reject("Save error: " + e.getMessage(), e);
        }
    }
}
