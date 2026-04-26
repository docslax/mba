import { Container } from "@chakra-ui/react";
import { Header } from "./Header";
import { Banner } from "./Banner";
import { BackNav } from "./BackNav";
import { Footer } from "./Footer";

export const Layout = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <>
      <Header />
      <BackNav />
      <Banner title={title} />
      <Container maxW="container.lg" mt={6}>
        {children}
      </Container>
      <Footer />
    </>
  );
};
