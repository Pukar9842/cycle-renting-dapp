import React, { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner,
  Image,
  Icon,
} from "@chakra-ui/react";
import { useWeb3 } from "../context/Web3Context";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { FaBicycle, FaUpload } from "react-icons/fa";

const ListCycle = () => {
  const { contract, isConnected } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    pricePerHour: "",
  });

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.pricePerHour) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseFloat(formData.pricePerHour) <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    try {
      setLoading(true);
      const priceInWei = ethers.parseEther(formData.pricePerHour);

      const tx = await contract.listCycle(
        formData.name,
        formData.description,
        formData.imageUrl || "https://via.placeholder.com/300x200?text=Cycle",
        priceInWei
      );

      toast.promise(tx.wait(), {
        loading: "Listing your cycle...",
        success: "Cycle listed successfully!",
        error: "Failed to list cycle",
      });

      await tx.wait();

      // Reset form
      setFormData({
        name: "",
        description: "",
        imageUrl: "",
        pricePerHour: "",
      });
    } catch (error) {
      console.error("Error listing cycle:", error);
      toast.error(error.message || "Failed to list cycle");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} textAlign="center">
          <Heading>List Your Cycle</Heading>
          <Alert status="warning">
            <AlertIcon />
            Please connect your wallet to list a cycle
          </Alert>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <VStack spacing={4} textAlign="center">
          <Heading>List Your Cycle</Heading>
          <Text color="gray.600">
            Share your cycle with the community and earn money
          </Text>
        </VStack>

        <Box
          bg={bg}
          p={8}
          rounded="lg"
          shadow="md"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <form onSubmit={handleSubmit}>
            <VStack spacing={6}>
              {/* Cycle Name */}
              <FormControl isRequired>
                <FormLabel>Cycle Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Mountain Bike Pro, City Cruiser"
                />
              </FormControl>

              {/* Description */}
              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Describe your cycle, its features, condition, etc."
                  rows={4}
                />
              </FormControl>

              {/* Image URL */}
              <FormControl>
                <FormLabel>Image URL (Optional)</FormLabel>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) =>
                    handleInputChange("imageUrl", e.target.value)
                  }
                  placeholder="https://example.com/cycle-image.jpg"
                />
                {formData.imageUrl && (
                  <Box mt={2}>
                    <Image
                      src={formData.imageUrl}
                      alt="Preview"
                      maxH="200px"
                      borderRadius="md"
                      fallbackSrc="https://via.placeholder.com/300x200?text=Invalid+URL"
                    />
                  </Box>
                )}
              </FormControl>

              {/* Price per Hour */}
              <FormControl isRequired>
                <FormLabel>Price per Hour (ETH)</FormLabel>
                <NumberInput
                  value={formData.pricePerHour}
                  onChange={(value) => handleInputChange("pricePerHour", value)}
                  min={0.001}
                  max={10}
                  precision={4}
                >
                  <NumberInputField placeholder="0.01" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Recommended: 0.01 - 0.1 ETH per hour
                </Text>
              </FormControl>

              {/* Preview Card */}
              {formData.name && (
                <Box
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="lg"
                  p={4}
                  width="100%"
                >
                  <Text fontWeight="bold" mb={2}>
                    Preview:
                  </Text>
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">{formData.name}</Text>
                      <Text color="brand.500" fontWeight="bold">
                        {formData.pricePerHour || "0"} ETH/hour
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                      {formData.description}
                    </Text>
                  </VStack>
                </Box>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                width="100%"
                isLoading={loading}
                loadingText="Listing Cycle..."
                leftIcon={<Icon as={FaBicycle} />}
              >
                List Cycle
              </Button>
            </VStack>
          </form>
        </Box>

        {/* Info Alert */}
        <Alert status="info">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold">Important Information:</Text>
            <Text fontSize="sm">
              • Your cycle will be available for rent immediately after listing
            </Text>
            <Text fontSize="sm">
              • You'll receive 95% of the rental fee (5% platform fee)
            </Text>
            <Text fontSize="sm">
              • You can remove your cycle from listing at any time
            </Text>
            <Text fontSize="sm">• Rentals are for 1-24 hours duration</Text>
          </VStack>
        </Alert>
      </VStack>
    </Container>
  );
};

export default ListCycle;
