import React from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  Icon,
  useColorModeValue,
  Image,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { FaBicycle, FaShieldAlt, FaClock, FaCoins } from "react-icons/fa";

const Home = () => {
  const { isConnected } = useWeb3();
  const bg = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("gray.50", "gray.700");

  const features = [
    {
      icon: FaBicycle,
      title: "Decentralized Rentals",
      description:
        "Rent cycles directly from owners without intermediaries using smart contracts.",
    },
    {
      icon: FaShieldAlt,
      title: "Secure Payments",
      description:
        "All transactions are secured by blockchain technology with automatic escrow.",
    },
    {
      icon: FaClock,
      title: "Flexible Duration",
      description:
        "Rent for as little as 1 hour or up to 24 hours based on your needs.",
    },
    {
      icon: FaCoins,
      title: "Earn Money",
      description: "List your cycles and earn money when others rent them.",
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box bg={bg} py={20}>
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <Heading
              as="h1"
              size="2xl"
              bgGradient="linear(to-r, brand.500, brand.700)"
              bgClip="text"
            >
              Rent Cycles on the Blockchain
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              The first decentralized cycle rental platform built on Ethereum.
              Connect your wallet, browse available cycles, and start renting in
              minutes.
            </Text>
            <HStack spacing={4}>
              {isConnected ? (
                <Button
                  as={RouterLink}
                  to="/browse"
                  size="lg"
                  colorScheme="brand"
                  leftIcon={<Icon as={FaBicycle} />}
                >
                  Browse Cycles
                </Button>
              ) : (
                <Button
                  size="lg"
                  colorScheme="brand"
                  leftIcon={<Icon as={FaBicycle} />}
                >
                  Connect Wallet to Start
                </Button>
              )}
              <Button
                as={RouterLink}
                to="/list-cycle"
                size="lg"
                variant="outline"
                colorScheme="brand"
              >
                List Your Cycle
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={20} bg={cardBg}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading size="xl">Why Choose CycleRent?</Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl">
                Experience the future of cycle rentals with blockchain
                technology
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
              {features.map((feature, index) => (
                <VStack
                  key={index}
                  bg={bg}
                  p={6}
                  rounded="lg"
                  shadow="md"
                  spacing={4}
                  textAlign="center"
                  _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
                  transition="all 0.2s"
                >
                  <Icon as={feature.icon} w={8} h={8} color="brand.500" />
                  <Heading size="md">{feature.title}</Heading>
                  <Text color="gray.600">{feature.description}</Text>
                </VStack>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box py={20} bg={bg}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading size="xl">How It Works</Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl">
                Get started in three simple steps
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <VStack spacing={4} textAlign="center">
                <Box
                  w={16}
                  h={16}
                  bg="brand.500"
                  color="white"
                  rounded="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="2xl"
                  fontWeight="bold"
                >
                  1
                </Box>
                <Heading size="md">Connect Wallet</Heading>
                <Text color="gray.600">
                  Connect your MetaMask wallet to access the platform
                </Text>
              </VStack>

              <VStack spacing={4} textAlign="center">
                <Box
                  w={16}
                  h={16}
                  bg="brand.500"
                  color="white"
                  rounded="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="2xl"
                  fontWeight="bold"
                >
                  2
                </Box>
                <Heading size="md">Browse & Rent</Heading>
                <Text color="gray.600">
                  Find available cycles and rent them for your desired duration
                </Text>
              </VStack>

              <VStack spacing={4} textAlign="center">
                <Box
                  w={16}
                  h={16}
                  bg="brand.500"
                  color="white"
                  rounded="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="2xl"
                  fontWeight="bold"
                >
                  3
                </Box>
                <Heading size="md">Return & Pay</Heading>
                <Text color="gray.600">
                  Return the cycle on time and payment is automatically
                  processed
                </Text>
              </VStack>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={20} bg="brand.500" color="white">
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <Heading size="xl">Ready to Start?</Heading>
            <Text fontSize="lg" maxW="2xl">
              Join the decentralized revolution and experience the future of
              cycle rentals
            </Text>
            <HStack spacing={4}>
              <Button
                as={RouterLink}
                to="/browse"
                size="lg"
                variant="outline"
                color="white"
                borderColor="white"
                _hover={{ bg: "white", color: "brand.500" }}
              >
                Browse Cycles
              </Button>
              <Button
                as={RouterLink}
                to="/list-cycle"
                size="lg"
                bg="white"
                color="brand.500"
                _hover={{ bg: "gray.100" }}
              >
                List Your Cycle
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
