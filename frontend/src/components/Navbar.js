import React from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  HStack,
  Link as ChakraLink,
  useColorModeValue,
  IconButton,
  useDisclosure,
  VStack,
  Icon,
} from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { FaBicycle, FaWallet, FaSignOutAlt, FaTools } from "react-icons/fa";

const Navbar = () => {
  const { isConnected, account, connectWallet, disconnectWallet, isLoading } =
    useWeb3();
  const { isOpen, onToggle } = useDisclosure();
  const location = useLocation();
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const NavLink = ({ children, to }) => {
    const isActive = location.pathname === to;
    return (
      <ChakraLink
        as={RouterLink}
        to={to}
        px={2}
        py={1}
        rounded={"md"}
        _hover={{
          textDecoration: "none",
          bg: useColorModeValue("gray.200", "gray.700"),
        }}
        bg={isActive ? "brand.500" : "transparent"}
        color={isActive ? "white" : "inherit"}
      >
        {children}
      </ChakraLink>
    );
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Box
      bg={bg}
      px={4}
      borderBottom={1}
      borderStyle={"solid"}
      borderColor={borderColor}
    >
      <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
        <IconButton
          size={"md"}
          icon={isOpen ? <Icon as={FaBicycle} /> : <Icon as={FaBicycle} />}
          aria-label={"Open Menu"}
          display={{ md: "none" }}
          onClick={onToggle}
        />

        <HStack spacing={8} alignItems={"center"}>
          <Box>
            <Text fontSize="lg" fontWeight="bold" color="brand.500">
              <Icon as={FaBicycle} mr={2} />
              CycleRent
            </Text>
          </Box>
          <HStack as={"nav"} spacing={4} display={{ base: "none", md: "flex" }}>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/browse">Browse Cycles</NavLink>
            {isConnected && (
              <>
                <NavLink to="/my-rentals">My Rentals</NavLink>
                <NavLink to="/my-cycles">My Cycles</NavLink>
                <NavLink to="/list-cycle">List Cycle</NavLink>
                <NavLink to="/admin">
                  <Icon as={FaTools} mr={1} />
                  Admin
                </NavLink>
              </>
            )}
          </HStack>
        </HStack>

        <Flex alignItems={"center"}>
          {isConnected ? (
            <HStack spacing={4}>
              <Text fontSize="sm" color="gray.600">
                {formatAddress(account)}
              </Text>
              <Button
                leftIcon={<FaSignOutAlt />}
                variant="outline"
                size="sm"
                onClick={disconnectWallet}
              >
                Disconnect
              </Button>
            </HStack>
          ) : (
            <Button
              leftIcon={<FaWallet />}
              colorScheme="brand"
              variant="solid"
              size="sm"
              onClick={connectWallet}
              isLoading={isLoading}
              loadingText="Connecting..."
            >
              Connect Wallet
            </Button>
          )}
        </Flex>
      </Flex>

      {isOpen ? (
        <Box pb={4} display={{ md: "none" }}>
          <VStack as={"nav"} spacing={4}>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/browse">Browse Cycles</NavLink>
            {isConnected && (
              <>
                <NavLink to="/my-rentals">My Rentals</NavLink>
                <NavLink to="/my-cycles">My Cycles</NavLink>
                <NavLink to="/list-cycle">List Cycle</NavLink>
                <NavLink to="/admin">
                  <Icon as={FaTools} mr={1} />
                  Admin
                </NavLink>
              </>
            )}
          </VStack>
        </Box>
      ) : null}
    </Box>
  );
};

export default Navbar;
