import { animals } from "../animals.js";

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");
  canvas.style.opacity = 0;

  setTimeout(() => {
    canvas.style.opacity = 1;
  }, 1000); // adjust delay to match duration of transition (2 seconds)

  const processImage = async (blobImage) => {
    const subscriptionKey = "0c37709b75944f9eae127a758c630a49";
    const endpoint = "https://animal-recognition.cognitiveservices.azure.com/";
    const uriBase = endpoint + "vision/v3.2/analyze";

    const params = {
      visualFeatures: "Categories,Description,Color",
      details: "",
      language: "en",
    };

    try {
      const resizedBlob = await resizeImage(blobImage, 1000, 1000, 0.7);
      const response = await fetch(
        uriBase + "?" + new URLSearchParams(params),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Ocp-Apim-Subscription-Key": subscriptionKey,
          },
          body: resizedBlob,
        }
      );
      const data = await response.json();

      const fullCaption = data?.description?.captions?.[0]?.text ?? "";
      document.getElementById("AIresponse").innerHTML = fullCaption;

      let animalName = "";
      for (const name of animals) {
        // Check if the singular or plural form of the animal name is included in the caption
        const regex = new RegExp(`\\b${name}(s)?\\b`, "i");
        if (regex.test(fullCaption)) {
          animalName = name;
          break;
        }
      }
      document.getElementById("animalName").innerHTML =
        animalName || "Animal not recognized";

      canvas.style.opacity = 1; // Reset the opacity of the canvas
    } catch (error) {
      document.getElementById(
        "AIresponse"
      ).innerHTML = `Error processing image: ${error}`;
    }
  };

  const handleFileSelect = (evt) => {
    const files = evt.target.files;
    const file = files[0];

    // Clear the animalName and AIresponse elements
    document.getElementById("animalName").innerHTML = "";
    document.getElementById("AIresponse").innerHTML = "";

    if (file.type.match("image.*")) {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            processImage(blob);
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  document
    .getElementById("fileinput")
    .addEventListener("change", handleFileSelect);

  document.getElementById("fileinput").addEventListener("click", () => {
    canvas.style.opacity = 0;
  });
});

const resizeImage = (blob, maxWidth, maxHeight, quality) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = reject;
  });
};
