import { MethodABI, Parameter } from '../json';
import { Method, MethodResponse } from './';

/**
 * Wrapper class for methods with the same name
 * Since methods can overload each other, we need this to be able to call methods by name and
 *   intelligently determine the correct one to call by parameter
 */
export class MethodContainer {
  private readonly methods: Method[];
  private address: string;

  constructor() {
    this.methods = [];
  }

  /**
   * Add a method to this container
   * @param method The method to add
   */
  add(method: Method): void {
    this.methods.push(method);
  }

  /**
   * Set the instance address of this deployed contract
   * @param address The address to set
   */
  setAddress(address: string): void {
    this.address = address;
  }

  /**
   * Describe the interface for methods
   */
  explain(): MethodABI[] {
    return this.methods.map((method) => method.explain());
  }

  /**
   * Call this method with the given parameters
   * @param args Solidity parameters to call the method with
   */
  call(args: { [key: string]: any }): MethodResponse {
    const closeMatchMethods: Method[] = [];
    const badMatchMethods: Method[] = [];

    // Separate the methods that define each given argument as a parameter from those that don't
    this.methods.forEach((method: Method) => {
      const inputNames = method.explain().inputs.map((input: Parameter) => input.name);
      const givenButUndefined = Object.keys(args).filter((paramName: string) => inputNames.includes(paramName));
      if (givenButUndefined.length > 1) {
        badMatchMethods.push(method);
      } else {
        closeMatchMethods.push(method);
      }
    });

    // Return the response for the first method that doesn't throw

    // Try all of the methods with closely matching parameters first, then the poorly matching ones
    let err;
    for (const method of closeMatchMethods.concat(badMatchMethods)) {
      try {
        return Object.assign(method.call(args), { address: this.address });
      } catch (e) {
        // expected if we have non-matching params
        err = e;
      }
    }

    // If none of them work, throw the parse error from any of them
    throw err;
  }
}
