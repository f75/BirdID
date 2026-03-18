export const analyzeBirdImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch("http://localhost:8000/identify", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return {
      species: data.species || "Unknown Bird",
      confidence: data.confidence || 0
    };
  } catch (error) {
    console.error("Error calling SpeciesNet backend:", error);
    throw error;
  }
};
