import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { LoginUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtServices: JwtService
  ){}

  async create(createUserDto: CreateUserDto) {
    try {
      const {password, ...userData} = createUserDto;
      const user = this.userRepository.create({ 
        ...userData,
        password: bcrypt.hashSync(password, 10)
      });
      await this.userRepository.save(user);
      delete user.password;
      
      return {
        ...user,
        token: this.getJwtToken({ id: user.id })
      };
      //retornar el JWT
    } catch (error) {
      this.handleDBErrors(error);
    }
    // return 'This action adds a new auth';
  }

  async login(loginUserDto: LoginUserDto) {
    // try {
      const {password, email} = loginUserDto;

      const user = await this.userRepository.findOne({
        where: {email},
        select: {id:true, email: true, password: true}
      });

      if(!user) throw new UnauthorizedException(`Credentials are not valid (eamil)`);

      if(!bcrypt.compareSync(password, user.password))
        throw new UnauthorizedException(`Credentials are not valid (password)`);

      return {
        ...user,
        token: this.getJwtToken({ id: user.id })
      };
      // retornar el JWT
    // } catch (error) {
    //   this.handleDBErrors(error);
    // }
    // return 'This action adds a new auth';
  }

  private getJwtToken(payload: JwtPayload){
    const token = this.jwtServices.sign(payload);
    return token;
  }

  private handleDBErrors(error: any):never{
    if(error.code === '23505')
      throw new BadRequestException(error.detail);
    
    console.log(error);
    throw new InternalServerErrorException('Please check server logs');
  }
}
