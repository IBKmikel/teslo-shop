import { Injectable } from '@nestjs/common';
// import { Product } from 'src/products/entities';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {
  constructor(
    // @InjectModel(Product.name)
    private readonly productsServices: ProductsService
  ){
  }

  async runSeed(){
    await this.insertNewProducts();

    return 'Seed Executed';
  }

  private async insertNewProducts(){
    await this.productsServices.deleteAllProducts();

    const products = initialData.products;

    const insertPromises = [];

    products.forEach(product => {
      insertPromises.push(
        this.productsServices.create(product));
    });

    await Promise.all(insertPromises);

    return true;
  }
}
