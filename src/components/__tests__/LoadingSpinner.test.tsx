import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner, PageLoader } from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("should render with default size", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute("aria-label", "Carregando");
  });

  it("should render with text", () => {
    render(<LoadingSpinner text="Carregando dados..." />);
    expect(screen.getByText("Carregando dados...")).toBeInTheDocument();
  });

  it("should render with different sizes", () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    let spinner = screen.getByRole("status");
    expect(spinner.className).toContain("h-4 w-4");

    rerender(<LoadingSpinner size="md" />);
    spinner = screen.getByRole("status");
    expect(spinner.className).toContain("h-8 w-8");

    rerender(<LoadingSpinner size="lg" />);
    spinner = screen.getByRole("status");
    expect(spinner.className).toContain("h-12 w-12");
  });
});

describe("PageLoader", () => {
  it("should render with default message", () => {
    render(<PageLoader />);
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("should render with custom message", () => {
    render(<PageLoader message="Aguarde..." />);
    expect(screen.getByText("Aguarde...")).toBeInTheDocument();
  });
});
