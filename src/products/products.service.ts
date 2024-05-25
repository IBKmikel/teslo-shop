import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as IsUUID} from 'uuid'
import { isUUID } from 'class-validator';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger();
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ){}
  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    return this.productRepository.find({
      take: limit,
      skip: offset
      //TODO: Relaciones
    });
  }

  async findOne(field: string) {
    let product: Product;

    if(isUUID(field)){
      product = await this.productRepository.findOneBy({id: field})
    }else{
      // product = await this.productRepository.findOneBy({slug: field})  
      const queryBuilder = this.productRepository.createQueryBuilder();
      product = await queryBuilder
                    .where(`UPPER(title) =:title or slug =:slug`,{
                      title: field.toUpperCase(),
                      slug: field.toLowerCase()
                    }).getOne();
    }

    if(!product)
      throw new NotFoundException(`Product with: ${field}, not found.`);
    
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({
      id,
      ...updateProductDto
    });

    if(!product)
      throw new NotFoundException(`Product with id: ${id}, not found.`);
    
    try {
      await this.productRepository.save(product);
      return product; 
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    return this.productRepository.remove(product);
  }

  private handleDBExceptions(error: any){
    if(error.code === '23505')
      throw new BadRequestException(error.detail);
    
    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
